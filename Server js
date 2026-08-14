app.post("/buy", async (req, res) => {
  console.log("BUY ROUTE HIT - body:", JSON.stringify(req.body));
  try {

    const { symbol, contract_type, amount, duration, duration_unit } = req.body;

    const proposal = await derivRequest({
      proposal: 1,
      amount: amount || 10,
      basis: "stake",
      contract_type: contract_type || "CALL",
      currency: "USD",
      duration: duration || 5,
      duration_unit: duration_unit || "m",
      symbol: symbol || "frxXAUUSD"
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
