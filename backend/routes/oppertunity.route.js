import express from "express";
import unstopFetchOppertunities from "../controllers/oppertunity.controller.js";

const route = express.Router();

route.post('/internships',unstopFetchOppertunities);

export default route;



