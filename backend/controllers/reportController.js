const User = require('../models/User');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const Earning = require('../models/Earning');
const AuditLog = require('../models/AuditLog');
const Wallet = require('../models/Wallet');

const convertToCSV = (data, fields) => {
  const header = fields.join(',') + '\n';
  const rows = data.map(row => {
    return fields.map(field => {
      let value = row[field];
      if (value === undefined || value === null) return '';
      // Stringify and escape commas/quotes
      value = typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  }).join('\n');
  return header + rows;
};

const exportUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' }).sort('-createdAt');
    const wallets = await Wallet.find();

    const formattedData = users.map(user => {
      const wallet = wallets.find(w => String(w.userId) === String(user._id));
      return {
        ID: user._id,
        Name: user.name,
        Email: user.email,
        Status: user.status,
        Balance: wallet ? wallet.balance : 0,
        TotalEarnings: wallet ? wallet.totalEarnings : 0,
        RegisteredAt: user.createdAt.toISOString()
      };
    });

    const csv = convertToCSV(formattedData, ['ID', 'Name', 'Email', 'Status', 'Balance', 'TotalEarnings', 'RegisteredAt']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users_report.csv');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

const exportInvestments = async (req, res, next) => {
  try {
    const investments = await Investment.find()
      .populate('userId', 'name email')
      .populate('planId', 'name')
      .sort('-createdAt');

    const formattedData = investments.map(inv => ({
      InvestmentID: inv._id,
      UserName: inv.userId ? inv.userId.name : 'Deleted User',
      UserEmail: inv.userId ? inv.userId.email : '',
      PlanName: inv.planId ? inv.planId.name : 'Unknown Plan',
      InvestedAmount: inv.amount,
      DailyProfitRate: inv.dailyProfitRate + '%',
      Status: inv.status,
      StartDate: inv.startDate.toISOString(),
      EndDate: inv.endDate.toISOString(),
      ProfitGenerated: inv.totalProfitGenerated
    }));

    const csv = convertToCSV(formattedData, [
      'InvestmentID', 'UserName', 'UserEmail', 'PlanName', 
      'InvestedAmount', 'DailyProfitRate', 'Status', 
      'StartDate', 'EndDate', 'ProfitGenerated'
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=investments_report.csv');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

const exportTransactions = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user._id };
    const transactions = await Transaction.find(filter)
      .populate('userId', 'name email')
      .sort('-createdAt');

    const formattedData = transactions.map(tx => ({
      TransactionID: tx._id,
      UserName: tx.userId ? tx.userId.name : 'Deleted User',
      UserEmail: tx.userId ? tx.userId.email : '',
      Type: tx.type,
      Amount: tx.amount,
      Status: tx.status,
      ReferenceCode: tx.transactionReference,
      PaymentMethod: tx.paymentMethod,
      Description: tx.description,
      Timestamp: tx.createdAt.toISOString()
    }));

    const csv = convertToCSV(formattedData, [
      'TransactionID', 'UserName', 'UserEmail', 'Type', 
      'Amount', 'Status', 'ReferenceCode', 'PaymentMethod', 
      'Description', 'Timestamp'
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions_report.csv');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

const exportEarnings = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user._id };
    const earnings = await Earning.find(filter)
      .populate('userId', 'name email')
      .populate('investmentId', 'amount')
      .sort('-calculatedAt');

    const formattedData = earnings.map(earn => ({
      EarningID: earn._id,
      UserName: earn.userId ? earn.userId.name : 'Deleted User',
      UserEmail: earn.userId ? earn.userId.email : '',
      ProfitPayout: earn.amount,
      ProfitPercentage: earn.percentageApplied + '%',
      EarningDay: earn.periodDate,
      Timestamp: earn.calculatedAt.toISOString()
    }));

    const csv = convertToCSV(formattedData, ['EarningID', 'UserName', 'UserEmail', 'ProfitPayout', 'ProfitPercentage', 'EarningDay', 'Timestamp']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=earnings_report.csv');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

const exportAudits = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('actionBy', 'name email')
      .sort('-createdAt');

    const formattedData = logs.map(log => ({
      AuditID: log._id,
      AdminName: log.actionBy ? log.actionBy.name : 'System',
      AdminEmail: log.actionBy ? log.actionBy.email : '',
      ActionType: log.actionType,
      TargetID: log.targetId || 'N/A',
      OldValues: log.oldValues ? JSON.stringify(log.oldValues) : 'N/A',
      NewValues: log.newValues ? JSON.stringify(log.newValues) : 'N/A',
      IPAddress: log.ipAddress,
      Timestamp: log.createdAt.toISOString()
    }));

    const csv = convertToCSV(formattedData, ['AuditID', 'AdminName', 'AdminEmail', 'ActionType', 'TargetID', 'OldValues', 'NewValues', 'IPAddress', 'Timestamp']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs_report.csv');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  exportUsers,
  exportInvestments,
  exportTransactions,
  exportEarnings,
  exportAudits
};
