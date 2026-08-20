const doctorRepo = require('../repositories/doctor.repository');
const { ApiError, ok } = require('../utils/response');

async function list(req, res, next) {
  try {
    ok(res, await doctorRepo.findAll());
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const doctor = await doctorRepo.findById(req.params.id);
    if (!doctor) throw new ApiError(404, 'Doctor not found');
    ok(res, doctor);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    ok(res, await doctorRepo.create(req.body), 201);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const doctor = await doctorRepo.update(req.params.id, req.body);
    if (!doctor) throw new ApiError(404, 'Doctor not found');
    ok(res, doctor);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const deleted = await doctorRepo.remove(req.params.id);
    if (!deleted) throw new ApiError(404, 'Doctor not found');
    ok(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
