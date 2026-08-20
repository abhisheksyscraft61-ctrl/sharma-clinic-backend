const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const favicon = require('serve-favicon');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');
const swaggerSpec = require('./config/swagger');

dotenv.config();

const authRoutes = require('./routes/auth.routes');
const clinicRoutes = require('./routes/clinic.routes');
const doctorRoutes = require('./routes/doctor.routes');
const patientRoutes = require('./routes/patient.routes');
const visitRoutes = require('./routes/visit.routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve favicon if present to avoid 404 noise from browsers
const faviconPath = path.join(__dirname, '..', 'uploads', 'favicon.ico');
if (fs.existsSync(faviconPath)) {
  app.use(favicon(faviconPath));
} else {
  app.get('/favicon.ico', (req, res) => res.sendStatus(204));
}

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('/', (req, res) => {
  res.json({
    message: 'ClinicCare API',
    status: 'running',
    health: '/health',
    api: '/api'
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/visits', visitRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;