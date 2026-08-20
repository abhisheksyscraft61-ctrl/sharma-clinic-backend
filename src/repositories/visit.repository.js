const { query, getClient } = require('../config/db');

/** All visits for a patient, newest first, each with its doctor/clinic
 *  names and attached files nested in. */
async function findByPatient(patientId) {
  const { rows: visits } = await query(
    `SELECT v.*, c.name AS clinic_name, d.name AS doctor_name
     FROM visits v
     LEFT JOIN clinics c ON c.id = v.clinic_id
     LEFT JOIN doctors d ON d.id = v.doctor_id
     WHERE v.patient_id = $1
     ORDER BY v.visit_date DESC, v.created_at DESC`,
    [patientId]
  );

  if (visits.length === 0) return [];

  const visitIds = visits.map((v) => v.id);
  const { rows: files } = await query(
    `SELECT * FROM visit_files WHERE visit_id = ANY($1::uuid[]) ORDER BY uploaded_at`,
    [visitIds]
  );

  return visits.map((v) => ({
    ...v,
    files: files.filter((f) => f.visit_id === v.id),
  }));
}

async function findById(id) {
  const { rows } = await query(
    `SELECT v.*, c.name AS clinic_name, d.name AS doctor_name
     FROM visits v
     LEFT JOIN clinics c ON c.id = v.clinic_id
     LEFT JOIN doctors d ON d.id = v.doctor_id
     WHERE v.id = $1`,
    [id]
  );
  if (!rows[0]) return null;

  const { rows: files } = await query(
    'SELECT * FROM visit_files WHERE visit_id = $1 ORDER BY uploaded_at',
    [id]
  );
  return { ...rows[0], files };
}

/**
 * Creates a visit plus its file attachments in a single transaction,
 * so a failed file insert never leaves an orphan visit row.
 */
async function create({ patientId, clinicId, doctorId, visitDate, notes, createdBy, files }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO visits (patient_id, clinic_id, doctor_id, visit_date, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [patientId, clinicId, doctorId, visitDate, notes, createdBy]
    );
    const visit = rows[0];

    const savedFiles = [];
    for (const f of files || []) {
      const { rows: fileRows } = await client.query(
        `INSERT INTO visit_files (visit_id, file_name, file_path, file_type, file_size)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [visit.id, f.fileName, f.filePath, f.fileType, f.fileSize]
      );
      savedFiles.push(fileRows[0]);
    }

    await client.query('COMMIT');
    return { ...visit, files: savedFiles };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function remove(id) {
  const { rowCount } = await query('DELETE FROM visits WHERE id = $1', [id]);
  return rowCount > 0;
}

async function findFileById(fileId) {
  const { rows } = await query('SELECT * FROM visit_files WHERE id = $1', [fileId]);
  return rows[0];
}

async function removeFile(fileId) {
  const { rowCount } = await query('DELETE FROM visit_files WHERE id = $1', [fileId]);
  return rowCount > 0;
}

module.exports = { findByPatient, findById, create, remove, findFileById, removeFile };
