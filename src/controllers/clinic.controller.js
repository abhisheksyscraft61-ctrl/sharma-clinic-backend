const clinicRepo = require('../repositories/clinic.repository');
const { ApiError, ok } = require('../utils/response');

async function list(req, res, next) {
  try {
    const clinics = await clinicRepo.findAll();
    const withStats = await Promise.all(
      clinics.map(async (c) => ({ ...c, stats: await clinicRepo.statsById(c.id) }))
    );
    ok(res, withStats);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const clinic = await clinicRepo.findById(req.params.id);
    if (!clinic) throw new ApiError(404, 'Clinic not found');
    const stats = await clinicRepo.statsById(clinic.id);
    ok(res, { ...clinic, stats });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const clinic = await clinicRepo.create(req.body);
    ok(res, clinic, 201);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const clinic = await clinicRepo.update(req.params.id, req.body);
    if (!clinic) throw new ApiError(404, 'Clinic not found');
    ok(res, clinic);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const deleted = await clinicRepo.remove(req.params.id);
    if (!deleted) throw new ApiError(404, 'Clinic not found');
    ok(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
