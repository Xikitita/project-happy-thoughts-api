import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import expressListEndpoints from "express-list-endpoints";

dotenv.config()

const mongoUrl =
  process.env.MONGO_URL || "mongodb://localhost/project-happy-thoughts-mongo";
mongoose.connect(mongoUrl);
mongoose.Promise = Promise;

const port = process.env.PORT || 8080;
const app = express();

const Thought = mongoose.model("Thought", {
  message: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 140,
  },
  hearts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send(expressListEndpoints(app));
});

//GET thoughts
app.get("/thoughts", async (req, res) => {
  const thoughts = await Thought.find()
    .sort({ createdAt: "desc" })
    .limit(20)
    .exec();
  res.json(thoughts);
});

//POST thoughts
app.post("/thoughts", async (req, res) => {
  const { message, hearts, createdAt } = req.body;
  const thought = new Thought({ message, hearts, createdAt });

  try {
    //Success case
    const savedThougth = await thought.save();
    res.status(201).json(savedThougth);
  } catch (err) {
    //fail case
    res.status(400).json({
      message:
        "Couldn't save thought. Please try again, your thoughts are important.",
      error: err.errors,
    });
  }
});

// Given a valid thought id in the URL, the API should
// find that thought, and update its `hearts` property to
// add one heart.
//POST thoughts/:thoughtId/like
app.patch("/thoughts/:thoughtId/like", async (req, res) => {
  const { thoughtId } = req.params;
  try {
    const thoughtsId = await Thought.findByIdAndUpdate(
      thoughtId,
      { $inc: { hearts: 1 } },
      { new: true, runValidators: true }
    );

    if (!thoughtsId) {
      return res.status(404).json({ message: "Thought not found." });
    }

    await thoughtsId.save();
    res.json({ message: "You just liked a thought!", thoughtsId });
  } catch (err) {
    res.status(404).json({
      message: "Something went wrong, please try again.",
      error: err.errors,
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
