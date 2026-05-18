const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.send("Geo Attendance Backend Running");
});

// Check in route
app.post("/checkin", (req, res) => {
    res.json({
        message: "Employee checked in successfully"
    });
});

// Check out route
app.post("/checkout", (req, res) => {
    res.json({
        message: "Employee checked out successfully"
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
