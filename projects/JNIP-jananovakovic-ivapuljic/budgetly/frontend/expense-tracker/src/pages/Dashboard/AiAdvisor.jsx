import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUserAuth } from "../../hooks/useUserAuth";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { LuSend, LuBot, LuUser, LuSparkles, LuTrendingUp, LuTrendingDown, LuInfo, LuTriangleAlert, LuCircleCheck } from "react-icons/lu";

const AiAdvisor = () => {
  useUserAuth();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchInsights();
    setMessages([
      {
        role: "assistant",
        content: "Pozdrav! 👋 Ja sam vaš AI finansijski savjetnik. Mogu vam pomoći da:\n\n• Analiziram vaše troškove i prihode\n• Dam personalizirane savjete za štednju\n• Predložim načine za optimizaciju budžeta\n• Odgovorim na pitanja o vašim financijama\n\nKako vam mogu pomoći danas?",
      },
    ]);
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.AI_ADVISOR.INSIGHTS);
      setInsights(response.data);
    } catch (error) {
      console.error("Failed to fetch insights:", error);
    } finally {
      setInsightsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await axiosInstance.post(API_PATHS.AI_ADVISOR.CHAT, {
        message: userMessage,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.message },
      ]);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Žao mi je, došlo je do greške. Molimo pokušajte ponovo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "Kako mogu smanjiti troškove?",
    "Gdje najviše trošim novac?",
    "Daj mi savjet za štednju",
    "Analiziraj moje financije",
  ];

  const getInsightIcon = (type) => {
    switch (type) {
      case "success":
        return <LuCircleCheck className="text-green-500" />;
      case "warning":
        return <LuTriangleAlert className="text-yellow-500" />;
      case "danger":
        return <LuTrendingDown className="text-red-500" />;
      case "info":
      default:
        return <LuInfo className="text-blue-500" />;
    }
  };

  const getInsightBg = (type) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "danger":
        return "bg-red-50 border-red-200";
      case "info":
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <DashboardLayout activeMenu="AI Savjetnik">
      <div className="my-5 mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
            <LuBot className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">AI Finansijski Savjetnik</h1>
            <p className="text-gray-500 text-sm">Personalizirani savjeti za vaše financije</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-[600px] flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.role === "user"
                          ? "bg-primary text-white"
                          : "bg-gradient-to-br from-purple-500 to-indigo-600 text-white"
                      }`}
                    >
                      {msg.role === "user" ? <LuUser /> : <LuBot />}
                    </div>
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-primary text-white rounded-tr-sm"
                          : "bg-gray-100 text-gray-800 rounded-tl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
                      <LuBot />
                    </div>
                    <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-100 p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(question)}
                      className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Upišite vaše pitanje..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    disabled={loading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !inputMessage.trim()}
                    className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <LuSend className="text-lg" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <LuSparkles className="text-purple-500" />
                <h3 className="font-semibold text-gray-800">Brzi Uvidi</h3>
              </div>
              {insightsLoading ? (
                <div className="space-y-3">
                  <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                  <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                </div>
              ) : insights?.insights?.length > 0 ? (
                <div className="space-y-3">
                  {insights.insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${getInsightBg(insight.type)}`}
                    >
                      <div className="flex items-start gap-2">
                        {getInsightIcon(insight.type)}
                        <p className="text-sm text-gray-700">{insight.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nema dostupnih uvida.</p>
              )}
            </div>

            {insights?.summary && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <LuTrendingUp className="text-green-500" />
                  <h3 className="font-semibold text-gray-800">Pregled Financija</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Saldo</span>
                    <span className={`font-semibold ${insights.summary.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {insights.summary.balance.toLocaleString()} EUR
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Prihodi</span>
                    <span className="font-semibold text-gray-800">
                      {insights.summary.totalIncome.toLocaleString()} EUR
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Troškovi</span>
                    <span className="font-semibold text-gray-800">
                      {insights.summary.totalExpenses.toLocaleString()} EUR
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-500">Stopa Štednje</span>
                    <span className={`font-semibold ${parseFloat(insights.summary.savingsRate) >= 20 ? "text-green-600" : "text-yellow-600"}`}>
                      {insights.summary.savingsRate}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AiAdvisor;
