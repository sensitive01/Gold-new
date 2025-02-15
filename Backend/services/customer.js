const Customer = require("../models/customer");
const otpService = require("./otp");
const mongoose = require("mongoose");
const axios = require("axios");
const jwt = require("jsonwebtoken");

async function find(query = {}) {
  try {
    if (query.createdAt && "$gte" in query.createdAt) {
      query.createdAt["$gte"] = new Date(
        new Date(query.createdAt["$gte"])
          .toISOString()
          .replace(/T.*Z/, "T00:00:00Z")
      );
    }
    if (query.createdAt && "$lte" in query.createdAt) {
      query.createdAt["$lte"] = new Date(
        new Date(query.createdAt["$lte"])
          .toISOString()
          .replace(/T.*Z/, "T23:59:59Z")
      );
    }
    if (query.branch) {
      query.branch = new mongoose.Types.ObjectId(query.branch);
    } else {
      delete query.branch;
    }
    if (!query.phoneNumber) {
      delete query.phoneNumber;
    }
    return await Customer.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "fileuploads",
          localField: "_id",
          foreignField: "uploadId",
          as: "profileImage",
        },
      },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branch",
        },
      },
      {
        $lookup: {
          from: "sales",
          localField: "_id",
          foreignField: "customer",
          as: "sales",
        },
      },
      {
        $addFields: {
          profileImage: { $first: "$profileImage" },
          branch: { $first: "$branch" },
        },
      },
      {
        $match: {
          sales: { $eq: [] },
        },
      },
      { $sort: { createdAt: -1 } },
    ]).exec();
  } catch (err) {
    throw err;
  }
}

async function findById(id) {
  try {
    return await Customer.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "fileuploads",
          localField: "_id",
          foreignField: "uploadId",
          as: "profileImage",
        },
      },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branch",
        },
      },
      {
        $addFields: {
          profileImage: { $first: "$profileImage" },
          branch: { $first: "$branch" },
        },
      },
      { $limit: 1 },
    ]).exec();
  } catch (err) {
    throw err;
  }
}

async function count(query = {}) {
  try {
    if (query.createdAt) {
      query.createdAt = new Date(query.createdAt).toISOString();
      query.createdAt = {
        $gte: new Date(query.createdAt.replace(/T.*Z/, "T00:00:00Z")),
        $lte: new Date(query.createdAt.replace(/T.*Z/, "T23:59:59Z")),
      };
    }
    return await Customer.count(query);
  } catch (err) {
    throw err;
  }
}

async function create(payload) {
  try {
    const latestSeq = await Customer.findOne({})
      .sort({ customerIdSeq: -1 })
      .exec();
    payload.customerIdSeq = (latestSeq?.customerIdSeq ?? 0) + 1;
    let customer = new Customer(payload);
    return await customer.save();
  } catch (err) {
    throw err;
  }
}

async function update(id, payload) {
  try {
    return await Customer.findByIdAndUpdate(id, payload, {
      returnDocument: "after",
    }).exec();
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    return await Customer.deleteMany({
      _id: {
        $in: id.split(","),
      },
    }).exec();
  } catch (err) {
    throw err;
  }
}

async function sendOtp(payload) {
  try {
    const otp = String(Math.floor(100000 + Math.random() * 900000)).substring(
      0,
      6
    );

    let res = await axios.get(
      `https://pgapi.vispl.in/fe/api/v1/send?username= Atticagold.trans&password=hhwGK&unicode=false&from=BENGLD&to=${payload.phoneNumber}&text=Hi.%20Thanks%20for%20choosing%20 Attica%20Gold%20Company%20to%20serve%20you.%20The%20One%20Time%20Password%20to%20verify%20your%20phone%20number%20is%20${otp}.%20Validity%20for%20this%20OTP%20is%205%20minutes%20only.%20Call%20us%20if%20you%20have%20any%20queries%20:%206366111999.%20Visit%20us%20:%20https://www. Atticagoldcompany.com%20&dltContentId=1707168655011078843`
    );
    if (res.data.statusCode == 200 && res.data.state == "SUBMIT_ACCEPTED") {
      const token = jwt.sign(
        {
          sub: {
            phoneNumber: payload.phoneNumber,
            otp,
          },
          iat: new Date().getTime(),
        },
        process.env.SECRET,
        { expiresIn: "5m" }
      );

      otpService.create({
        type: "customer",
        otp: otp,
        phoneNumber: payload.phoneNumber,
      });

      return {
        status: true,
        message: "OTP sent Successfully.",
        data: { token },
      };
    } else {
      return {
        status: false,
        message: "OTP not sent",
        data: {},
      };
    }
  } catch (err) {
    return {
      status: false,
      message: "OTP not sent",
      data: {},
    };
  }
}

function verifyOtp(payload) {
  try {
    const decoded = jwt.verify(payload.token, process.env.SECRET);
    const data = decoded.sub;
    if (!decoded) {
      return {
        status: false,
        message: "Otp is expired.",
        data: {},
      };
    }

    if (String(data.otp) !== String(payload.otp)) {
      return {
        status: false,
        message: "Invalid otp.",
        data: {},
      };
    }

    return {
      status: true,
      message: "OTP verified.",
      data: {},
    };
  } catch (err) {
    return {
      status: false,
      message: "Invalid otp.",
      data: {},
    };
  }
}

module.exports = {
  find,
  findById,
  count,
  create,
  update,
  remove,
  sendOtp,
  verifyOtp,
};
