import express from "express";
import HistoricalComplaint from "../models/historicalComplaints.js";

const router = express.Router();

/*
  Basic historical dataset summary
*/
router.get("/summary", async (req, res) => {
  try {
    const totalComplaints =
      await HistoricalComplaint.countDocuments();

    const categories =
      await HistoricalComplaint.aggregate([
        {
          $group: {
            _id: "$complaint_category",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

    const departments =
      await HistoricalComplaint.aggregate([
        {
          $group: {
            _id: "$department_assigned",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

    const statuses =
      await HistoricalComplaint.aggregate([
        {
          $group: {
            _id: "$complaint_status",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

    const averageResolution =
      await HistoricalComplaint.aggregate([
        {
          $match: {
            resolution_days: {
              $ne: null,
              $exists: true,
            },
          },
        },
        {
          $group: {
            _id: null,
            averageDays: {
              $avg: "$resolution_days",
            },
          },
        },
      ]);

    const wards =
      await HistoricalComplaint.aggregate([
        {
          $group: {
            _id: "$ward_area",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 10,
        },
      ]);

    res.json({
      totalComplaints,

      complaintCategories: categories,

      departments,

      statuses,

      averageResolutionDays:
        averageResolution[0]?.averageDays || 0,

      topWards: wards,
    });
  } catch (error) {
    console.error("Historical data error:", error);

    res.status(500).json({
      message: "Failed to analyze historical complaint data.",
      error: error.message,
    });
  }
});

router.get("/evidence", async (req, res) => {
  try {
    const { category, ward } = req.query;

    if (!category) {
      return res.status(400).json({
        message: "category is required.",
      });
    }

    // Build the filter dynamically
    const filter = {
      complaint_category: category,
    };

    if (ward) {
      filter.ward_area = ward;
    }

    // Total similar complaints
    const totalComplaints =
      await HistoricalComplaint.countDocuments(filter);

    // Resolution statistics
    const resolutionStats =
      await HistoricalComplaint.aggregate([
        {
          $match: {
            ...filter,
            resolution_days: {
              $exists: true,
              $ne: null,
            },
          },
        },
        {
          $group: {
            _id: null,
            averageResolutionDays: {
              $avg: "$resolution_days",
            },
            averageReassignments: {
              $avg: "$num_reassignments",
            },
          },
        },
      ]);

    // Complaint status distribution
    const statuses =
      await HistoricalComplaint.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: "$complaint_status",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

    // Departments handling these complaints
    const departments =
      await HistoricalComplaint.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: "$department_assigned",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

    // Year-wise recurrence
    const yearlyTrend =
      await HistoricalComplaint.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: "$year",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

    // Citizen satisfaction
    const satisfaction =
      await HistoricalComplaint.aggregate([
        {
          $match: {
            ...filter,
            citizen_satisfied: {
              $exists: true,
              $ne: null,
            },
          },
        },
        {
          $group: {
            _id: "$citizen_satisfied",
            count: { $sum: 1 },
          },
        },
      ]);

    res.json({
      query: {
        category,
        ward: ward || null,
      },

      totalSimilarComplaints: totalComplaints,

      averageResolutionDays:
        resolutionStats[0]?.averageResolutionDays || 0,

      averageReassignments:
        resolutionStats[0]?.averageReassignments || 0,

      statuses,

      departments,

      yearlyTrend,

      satisfaction,
    });
  } catch (error) {
    console.error("Historical evidence error:", error);

    res.status(500).json({
      message: "Failed to retrieve historical evidence.",
      error: error.message,
    });
  }
});

export default router;