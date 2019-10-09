var mongoose = require("mongoose");
var Hospital = mongoose.model("Hospital");
const io = require("../socket");

exports.getHospitals = async (req, res, next) => {
  Hospital.find({})

    .then(allHospitals => {
      const objsArray = allHospitals.map(hospital => {
        let sum = 0;

        let contributions = hospital.waitingTime.length;
        let avarage = 0;
        hospital.waitingTime.forEach(time => {
          sum += time;
        });
        if (contributions > 0) avarage = sum / contributions;
        else avarage = 0;
        return {
          ...hospital._doc,
          waitingTime: avarage.toFixed(),
          contributions: contributions,
          comments: hospital.comments.length
        };
      });
      res.status(200).json({ allHospitals: objsArray });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.setWaitingTime = async (req, res, next) => {
  try {
    const hospitalId = req.body.hospitalId;
    const hospital = await Hospital.findById(hospitalId);

    const reqTime = req.body.waitingTime;
    console.log(reqTime);
    const isValid = Number(reqTime);
    if (!isValid || isValid <= 0) {
      throw new Error("Wrong input type!");
    }
    const userTime = isValid.toFixed();
    let newWaitingTime = 0;
    let sum = 0;
    let contributions = hospital.waitingTime.length;
    await hospital.waitingTime.forEach(time => {
      sum += time;
    });
    newWaitingTime = (sum + parseInt(userTime)) / (contributions + 1);
    newWaitingTime = newWaitingTime.toFixed();

    hospital.waitingTime.push(parseInt(userTime));
    await hospital.save();
    io.getIO().emit("time", {
      action: "update",
      hospital: {
        waitingTime: newWaitingTime,
        hospitalId: hospitalId,
        contributions: contributions + 1
      }
    });
    res.status(200).json({ message: "Tempo de espera atualizado!" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.indication = async (req, res, next) => {
  try {
    const informations = req.body;
    let findBetterTime = null;
    const completeInformation = await informations.map(async information => {
      const hospital = await Hospital.findById(information.hospitalId, {
        waitingTime: 1
      });
      if (!hospital) {
        throw new Error();
      }
      let waitingTime = 0;
      let contributions = hospital.waitingTime.length;
      let sumWaitingTimes = 0;
      let totalTimeToConsult = 0;
      hospital.waitingTime.forEach(time => {
        sumWaitingTimes += time;
      });
      if (contributions > 0) {
        waitingTime = sumWaitingTimes / contributions;
        waitingTime = waitingTime.toFixed();

        totalTimeToConsult =
          parseInt(waitingTime) + parseInt(information.duration);
        findBetterTime =
          findBetterTime === null
            ? totalTimeToConsult
            : findBetterTime > totalTimeToConsult
            ? totalTimeToConsult
            : findBetterTime;
      } else {
        (waitingTime = 0), (totalTimeToConsult = 0);
      }
      return {
        ...information,
        waitingTime: waitingTime,
        totalTimeToConsult: totalTimeToConsult
      };
    });

    let result = await Promise.all(completeInformation);

    let resultFlags = null;
    if (findBetterTime) {
      let resultSort = result.sort((a, b) =>
        a.totalTimeToConsult > b.totalTimeToConsult ? 1 : -1
      );
      let range = Math.round(findBetterTime / 2.5); //distância do melhor valor para saber se se encaixa na mesma flag
      let limit = findBetterTime + range; //valor limite para entrar na flag green
      resultFlags = resultSort.map(res => {
        if (res.totalTimeToConsult === 0) {
          return {
            ...res,
            flag: "normal"
          };
        } else if (limit > res.totalTimeToConsult) {
          return {
            ...res,
            flag: "green"
          };
        } else {
          return {
            ...res,
            flag: "red"
          };
        }
      });
    }
    console.log(resultFlags);
    res.status(200).json({
      message: "Indicação realizada com sucesso!",
      indicationList: resultFlags ? resultFlags : result,
      results: resultFlags ? true : false
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
