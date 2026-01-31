const Income = require("../models/Income");
const Expense = require("../models/Expense");
const { Types } = require("mongoose");

exports.getFinancialAdvice = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new Types.ObjectId(String(userId));
    const { message } = req.body;

    console.log("AI Advisor request received, message:", message);
    console.log("GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY);

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY not found in environment variables");
      return res.status(500).json({ message: "Groq API key not configured" });
    }

    const totalIncome = await Income.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalExpense = await Expense.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const recentExpenses = await Expense.find({ userId })
      .sort({ date: -1 })
      .limit(20);

    const recentIncomes = await Income.find({ userId })
      .sort({ date: -1 })
      .limit(20);

    const expensesByCategory = await Expense.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]);

    const incomeTotal = totalIncome[0]?.total || 0;
    const expenseTotal = totalExpense[0]?.total || 0;
    const balance = incomeTotal - expenseTotal;

    const financialContext = `
User's Financial Summary:
- Total Balance: ${balance} EUR
- Total Income: ${incomeTotal} EUR
- Total Expenses: ${expenseTotal} EUR

Spending by Category:
${expensesByCategory.map((cat) => `- ${cat._id || "Uncategorized"}: ${cat.total} EUR`).join("\n")}

Recent Expenses (last 20):
${recentExpenses.map((e) => `- ${e.category || "Other"}: ${e.amount} EUR - ${e.source || "No description"}`).join("\n")}

Recent Income (last 20):
${recentIncomes.map((i) => `- ${i.source || "Other"}: ${i.amount} EUR`).join("\n")}
`;

    const systemPrompt = `You are a friendly and helpful AI financial advisor for a personal budgeting app called Budgetly. 
You help users understand their spending habits, provide personalized advice, and suggest ways to save money.
Always be encouraging and supportive. Give specific, actionable advice based on their actual financial data.
Keep responses concise but helpful. Use the user's financial data to provide personalized insights.
Respond in the same language the user writes to you (Croatian/Serbian or English).
Format your responses nicely with bullet points or numbered lists when appropriate.`;

    const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "system", content: `Current user financial data:\n${financialContext}` },
          { role: "user", content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API error:", errorData);
      return res.status(500).json({ message: "Failed to get AI response" });
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    res.json({
      message: aiMessage,
      financialSummary: {
        balance,
        totalIncome: incomeTotal,
        totalExpenses: expenseTotal,
      },
    });
  } catch (error) {
    console.error("AI Advisor error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getQuickInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new Types.ObjectId(String(userId));

    const totalIncome = await Income.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalExpense = await Expense.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const expensesByCategory = await Expense.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]);

    const incomeTotal = totalIncome[0]?.total || 0;
    const expenseTotal = totalExpense[0]?.total || 0;
    const balance = incomeTotal - expenseTotal;
    const savingsRate = incomeTotal > 0 ? ((incomeTotal - expenseTotal) / incomeTotal) * 100 : 0;
    const topCategory = expensesByCategory[0] || { _id: "None", total: 0 };

    const insights = [];

    if (savingsRate >= 20) {
      insights.push({
        type: "success",
        message: `Odlično! Štedite ${savingsRate.toFixed(1)}% svojih prihoda.`,
      });
    } else if (savingsRate >= 0) {
      insights.push({
        type: "warning",
        message: `Štedite samo ${savingsRate.toFixed(1)}% prihoda. Pokušajte povećati na 20%.`,
      });
    } else {
      insights.push({
        type: "danger",
        message: `Trošite više nego što zarađujete! Razlika: ${Math.abs(balance).toFixed(0)} EUR`,
      });
    }

    if (topCategory._id) {
      const categoryPercentage = expenseTotal > 0 ? (topCategory.total / expenseTotal) * 100 : 0;
      insights.push({
        type: "info",
        message: `Najviše trošite na: ${topCategory._id} (${categoryPercentage.toFixed(1)}% ukupnih troškova)`,
      });
    }

    res.json({
      insights,
      summary: {
        balance,
        totalIncome: incomeTotal,
        totalExpenses: expenseTotal,
        savingsRate: savingsRate.toFixed(1),
        topCategory: topCategory._id,
      },
    });
  } catch (error) {
    console.error("Quick insights error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
