const express = require("express");
const WebSocket = require("ws");

const app = express();
app.use(express.json());

const APP_ID = "1089";
const DERIV_TOKEN = process.env.DERIV_API_TOKEN;

function derivRequest(payload) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Deriv timeout"));
    }, 15000);

    ws.onopen = () => {
      if (DERIV_TOKEN) {
        ws.send(JSON.stringify({ authorize: DERIV_TOKEN }));
      } else {
        ws.send(JSON.stringify(payload));
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.msg_type === "authorize") {
        ws.send(JSON.stringify(payload));
      } else {
        clearTimeout(timeout);
        ws.close();
        resolve(data);
      }
    };

    ws.onerror = (err) => {
      clearTimeout(timeout);
      reject(err);
    };
  });
}

app.get("/", (req, res) => {
  res.send("Deriv middleware is running");
});

app.get("/price", async (req, res) => {
  try {
    const symbol = req.query.symbol || "frxXAUUSD";
    const result = await derivRequest({
      ticks_history: symbol,
      adjust_start_time: 1,
      count: 1,
      end: "latest",
      start: 1,
      style: "ticks"
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/buy", async (req, res) => {
  console.log("BUY ROUTE ENTERED. req.body =", req.body);
  try {
    const { symbol, contract_type, amount, duration, duration_unit } = req.body || {};
    console.log("Buy request received:", req.body);

    const proposal = await derivRequest({
      proposal: 1,
      amount: amount || 10,
      basis: "stake",
      contract_type: contract_type || "CALL",
      currency: "USD",
      duration: duration || 5,
      duration_unit: duration_unit || "m",
      underlying_symbol: symbol || "frxXAUUSD"
    });

    console.log("Proposal response:", JSON.stringify(proposal));

    if (proposal.error) {
      console.log("Proposal error:", proposal.error);
      return res.status(400).json({ error: proposal.error.message });
    }

    if (!proposal.proposal) {
      console.log("No proposal object in response:", proposal);
      return res.status(500).json({ error: "No proposal returned", raw: proposal });
    }

    const buyResult = await derivRequest({
      buy: proposal.proposal.id,
      price: proposal.proposal.ask_price
    });

    console.log("Buy result:", JSON.stringify(buyResult));

    res.json(buyResult);
  } catch (err) {
    console.log("Buy route error:", err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
