import { useEffect, useState } from "react";
import { supabase } from "../libs/supabaseClient";
import { calculateDebts } from "../libs/debtCalculator";
import { useToast } from "../libs/toast";
import { useConfirm } from "../libs/ConfirmModal";

const CURRENCIES = [
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
];

export default function ExpenseTracker({ tripId }) {
  const [expenses, setExpenses] = useState([]);
  const [tripMembers, setTripMembers] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newPayer, setNewPayer] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newMember, setNewMember] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || "€";

  useEffect(() => {
    if (!tripId) return;
    loadExpenses();
  }, [tripId]);

  // Recalculate debts when expenses or members change
  useEffect(() => {
    if (expenses.length > 0 && tripMembers.length > 0) {
      const calcs = calculateDebts(expenses, tripMembers);
      setSettlements(calcs);
    } else {
      setSettlements([]);
    }
  }, [expenses, tripMembers]);

  async function loadExpenses() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false });

      if (!error) {
        setExpenses(data ?? []);
      }
    } catch (err) {
      console.error("Error loading expenses:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadExpenses();
    setTimeout(() => setRefreshing(false), 500);
  }

  async function addExpense() {
    if (!newPayer.trim() || !newAmount.trim()) {
      toast.warning("Enter payer name and amount");
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      const { error } = await supabase
        .from("expenses")
        .insert({
          trip_id: tripId,
          user_id: user.id,
          payer_name: newPayer.trim(),
          amount_eur: parseFloat(newAmount),
          note: newNote.trim() || null,
        });

      if (error) {
        console.error("Supabase error:", error);
        toast.error("Error adding expense: " + error.message);
      } else {
        setNewPayer("");
        setNewAmount("");
        setNewNote("");
        loadExpenses();
        toast.success("Expense added!");
      }
    } catch (err) {
      console.error("Error adding expense:", err);
      toast.error("Error adding expense: " + err.message);
    }
  }

  function deleteExpense(id) {
    confirm("Are you sure you want to delete this expense?", async () => {
      try {
        await supabase.from("expenses").delete().eq("id", id);
        loadExpenses();
        toast.success("Expense deleted");
      } catch (err) {
        console.error("Error deleting expense:", err);
        toast.error("Failed to delete expense");
      }
    });
  }

  async function deleteAllExpensesFromDB() {
    try {
      await supabase.from("expenses").delete().eq("trip_id", tripId);
    } catch (err) {
      console.error("Error deleting all expenses:", err);
    }
  }

  function addMember() {
    if (!newMember.trim()) return;
    if (tripMembers.includes(newMember.trim())) {
      toast.warning("Member already added");
      return;
    }
    setTripMembers([...tripMembers, newMember.trim()]);
    setNewMember("");
    toast.success("Member added!");
  }

  function removeMember(member) {
    setTripMembers(tripMembers.filter((m) => m !== member));
  }

  function clearAllData() {
    confirm("Clear ALL data (members, expenses, settlements)?\n\nThis cannot be undone!", () => {
      setTripMembers([]);
      setExpenses([]);
      setSettlements([]);
      deleteAllExpensesFromDB();
      toast.success("All data cleared");
    });
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Currency Selector */}
      <div style={{ background: "white", borderRadius: 8, padding: 12, border: "1px solid #e5e7eb" }}>
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>💱 Currency</div>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          {CURRENCIES.map((curr) => (
            <option key={curr.code} value={curr.code}>
              {curr.symbol} {curr.code} - {curr.name}
            </option>
          ))}
        </select>
      </div>

      {/* Members Section */}
      <div style={{ background: "white", borderRadius: 8, padding: 12, border: "1px solid #e5e7eb" }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>👥 Trip Members</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
            placeholder="Add member name..."
            onKeyDown={(e) => e.key === "Enter" && addMember()}
            style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
          />
          <button
            onClick={addMember}
            style={{
              padding: "8px 12px",
              backgroundColor: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Add
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {tripMembers.length === 0 && (
            <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
              Add trip members to split expenses
            </div>
          )}
          {tripMembers.map((member) => (
            <div
              key={member}
              style={{
                padding: "6px 10px",
                backgroundColor: "#eef2ff",
                borderRadius: 6,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {member}
              <button
                onClick={() => removeMember(member)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Expense Section */}
      <div style={{ background: "white", borderRadius: 8, padding: 12, border: "1px solid #e5e7eb" }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>💰 Add Expense</div>
        <div style={{ display: "grid", gap: 10 }}>
          <select
            value={newPayer}
            onChange={(e) => setNewPayer(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
          >
            <option value="">Select who paid...</option>
            {tripMembers.map((member) => (
              <option key={member} value={member}>
                {member}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{
              padding: "8px 12px",
              backgroundColor: "#f1f5f9",
              borderRadius: "6px 0 0 6px",
              border: "1px solid #d1d5db",
              borderRight: "none",
              fontSize: 14,
              fontWeight: 600,
              color: "#475569",
            }}>
              {currencySymbol}
            </div>
            <input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="Amount"
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: "0 6px 6px 0",
                border: "1px solid #d1d5db",
                fontSize: 13,
              }}
            />
          </div>
          <input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="What for? (dinner, tickets, etc.)"
            style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
          />
          <button
            onClick={addExpense}
            disabled={!newPayer || !newAmount}
            style={{
              padding: "10px 12px",
              backgroundColor: !newPayer || !newAmount ? "#e2e8f0" : "#10b981",
              color: !newPayer || !newAmount ? "#94a3b8" : "white",
              border: "none",
              borderRadius: 6,
              cursor: !newPayer || !newAmount ? "not-allowed" : "pointer",
              fontWeight: 500,
            }}
          >
            + Add Expense
          </button>
        </div>
      </div>

      {/* Expenses List */}
      <div style={{ background: "white", borderRadius: 8, padding: 12, border: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>📋 Expenses ({expenses.length})</div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: "6px 10px",
              backgroundColor: refreshing ? "#e2e8f0" : "#6366f1",
              color: refreshing ? "#94a3b8" : "white",
              border: "none",
              borderRadius: 4,
              cursor: refreshing ? "not-allowed" : "pointer",
              fontSize: 11,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "all 0.2s ease",
            }}
          >
            <span style={{
              display: "inline-block",
              animation: refreshing ? "spin 1s linear infinite" : "none",
            }}>
              🔄
            </span>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        
        {loading && <div style={{ fontSize: 13, color: "#64748b" }}>Loading...</div>}
        {expenses.length === 0 && !loading && (
          <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic" }}>
            No expenses yet. Add members and start tracking!
          </div>
        )}
        
        <div style={{ display: "grid", gap: 8 }}>
          {expenses.map((exp) => (
            <div
              key={exp.id}
              style={{
                padding: "10px",
                backgroundColor: "#f8fafc",
                borderRadius: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>
                  {exp.payer_name} paid {currencySymbol}{exp.amount_eur.toFixed(2)}
                </div>
                {exp.note && <div style={{ fontSize: 12, color: "#64748b" }}>{exp.note}</div>}
              </div>
              <button
                onClick={() => deleteExpense(exp.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 4,
                  borderRadius: 4,
                  transition: "all 0.2s ease",
                }}
                title="Delete expense"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Calculate Button */}
      {expenses.length > 0 && tripMembers.length > 1 && (
        <button
          onClick={() => {
            const calcs = calculateDebts(expenses, tripMembers);
            setSettlements(calcs);
          }}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          🧮 Calculate Debts
        </button>
      )}

      {/* Settlements */}
      {settlements.length > 0 && (
        <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 12, border: "1px solid #86efac" }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: "#166534" }}>✅ Who Owes Whom</div>
          <div style={{ display: "grid", gap: 8 }}>
            {settlements.map((settlement, idx) => (
              <div
                key={idx}
                style={{
                  padding: "10px",
                  backgroundColor: "white",
                  borderRadius: 6,
                  fontSize: 13,
                  borderLeft: "3px solid #10b981",
                }}
              >
                <strong>{settlement.from}</strong> owes <strong>{settlement.to}</strong>{" "}
                <span style={{ color: "#10b981", fontWeight: 600 }}>
                  {currencySymbol}{settlement.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear All Data Button */}
      {(expenses.length > 0 || tripMembers.length > 0) && (
        <button
          onClick={clearAllData}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "transparent",
            color: "#ef4444",
            border: "1px solid #fca5a5",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 500,
            fontSize: 12,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#fef2f2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          🗑️ Clear All Data
        </button>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
