const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

// Set public DNS servers to bypass broken local DNS/router resolvers that fail SRV queries
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (err) {
  console.warn('Warning: Failed to set custom DNS servers:', err.message);
}

const mongoose = require('mongoose');

/**
 * Programmatically resolves mongodb+srv URIs to standard replica set URIs.
 * This is a robust fallback for environments where SRV resolution fails at driver level.
 */
const resolveAtlasSrv = async (mongoUri) => {
  if (!mongoUri.startsWith('mongodb+srv://')) {
    return mongoUri;
  }

  return new Promise((resolve) => {
    // Parse regex
    const regex = /^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/?([^?]*)(?:\?(.*))?$/;
    const match = mongoUri.match(regex);
    if (!match) {
      console.warn('Mismatched mongodb+srv connection string layout. Using original.');
      return resolve(mongoUri);
    }

    const [_, username, password, host, database, queryOptions] = match;

    dns.resolveSrv('_mongodb._tcp.' + host, async (srvErr, srvRecords) => {
      if (srvErr) {
        console.warn(`SRV resolution failed: ${srvErr.message}. Connecting with original URI.`);
        return resolve(mongoUri);
      }

      const shardHosts = srvRecords.map(r => `${r.name}:${r.port}`).join(',');

      dns.resolveTxt(host, (txtErr, txtRecords) => {
        let txtOptions = '';
        if (!txtErr && txtRecords && txtRecords.length > 0) {
          txtOptions = txtRecords[0].join('&');
        }

        const optionsList = [];
        if (txtOptions) optionsList.push(txtOptions);
        if (queryOptions) optionsList.push(queryOptions);
        if (!optionsList.some(o => o.includes('tls=') || o.includes('ssl='))) {
          optionsList.push('tls=true');
        }

        const mergedOptions = optionsList.join('&');
        const standardUri = `mongodb://${username}:${password}@${shardHosts}/${database}?${mergedOptions}`;
        
        console.log('Successfully converted SRV URI to standard replica set URI.');
        resolve(standardUri);
      });
    });
  });
};

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');

    let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/investment_platform';
    
    // Resolve mongodb+srv if configured
    if (mongoUri.startsWith('mongodb+srv://')) {
      mongoUri = await resolveAtlasSrv(mongoUri);
    }

    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;