const getDashboard = (req, res) => {
  try {
    const dashboardData = {
      application: "ASTRA",
      pages: [
        {
          name: "Health Data",
          path: "/health"
        },
        {
          name: "Mission Assistant",
          path: "/assistant"
        },
        {
          name: "Future Projection",
          path: "/projection"
        }
      ]
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard"
    });
  }
};

module.exports = { getDashboard };
