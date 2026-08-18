import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import globalErrorHandler from './middlewares/globalErrorHandler.js';
import { ProjectRoutes } from './modules/project/project.route.js';
import UserRoutes from './modules/user/user.route.js';
import AIRoutes from './modules/ai/ai.route.js';

class App {
    public app: Application;

    constructor() {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    /**
     * Configure global middlewares
     */
    private initializeMiddlewares() {
        this.app.use(cors());
        this.app.use(helmet());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    /**
     * Register application routes
     */
    private initializeRoutes() {
        // Health check route
        this.app.get('/', (req: Request, res: Response) => {
            res.send('AI Coding Assistant Backend is running in OOP structure! 🚀');
        });

        const userRoutes = new UserRoutes();
        this.app.use('/api/v1/users', userRoutes.router);

        const aiRoutes = new AIRoutes();
        this.app.use('/api/v1/ai', aiRoutes.router);

        const projectRoutes = new ProjectRoutes();
        this.app.use('/api/v1/projects', projectRoutes.router);
    }

    private initializeErrorHandling() {
        // Not Found Handler
        this.app.use((req: Request, res: Response) => {
            res.status(404).json({
                success: false,
                message: 'API route not found',
            });
        });

        // Global Error Handler
        this.app.use(globalErrorHandler);
    }
}

// Export the initialized Express application
export default new App().app;