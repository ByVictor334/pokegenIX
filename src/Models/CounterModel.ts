import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const CounterModel = mongoose.model("Counter", counterSchema);

export const getNextSequenceValue = async (
  sequenceName: string
): Promise<number> => {
  const sequenceDocument = await CounterModel.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequenceDocument.seq;
};
