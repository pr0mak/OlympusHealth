
const { aiRequest } = require("./aiGateway");

const runProjection = (payload) =>
  aiRequest("/api/v1/projection", {
    method: "POST",
    payload
  });

const getCatalog = () =>
  aiRequest("/api/v1/catalog");

const runHealthMpc = (payload) =>
  aiRequest("/api/v1/health-mpc", {
    method: "POST",
    payload
  });

const runHealthForecast = (payload) =>
  aiRequest("/api/v1/health-forecast", {
    method: "POST",
    payload
  });

const runExerciseImpact = (payload) =>
  aiRequest("/api/v1/exercise-impact", {
    method: "POST",
    payload
  });

module.exports = {
  runProjection,
  getCatalog,
  runHealthMpc,
  runHealthForecast,
  runExerciseImpact
};
