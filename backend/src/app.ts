import express from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects';
import testCasesRouter from './routes/testCases';
import testRunsRouter from './routes/testRuns';
import issuesRouter from './routes/issues';
import dashboardRouter from './routes/dashboard';
import bugReportsRouter from './routes/bugReports';
import reportBugRouter from './routes/reportBug';
import { dashboardController } from './controllers/dashboardController';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

app.use('/api/projects', projectsRouter);
app.use('/api/projects/:projectId/test-cases', testCasesRouter);
app.use('/api/projects/:projectId/test-runs', testRunsRouter);
app.use('/api/projects/:projectId/issues', issuesRouter);
app.use('/api/projects/:projectId/bug-reports', bugReportsRouter);
app.use('/api/projects/:projectId/dashboard', (req, res, next) => {
  dashboardController.project(req, res, next);
});
app.use('/api/dashboard', dashboardRouter);
app.use('/api/report-bug', reportBugRouter);

app.use(errorHandler);
