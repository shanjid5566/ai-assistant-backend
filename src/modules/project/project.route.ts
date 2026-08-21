import { Router } from 'express';
import { ProjectController } from './project.controller.js';

export class ProjectRoutes {
    public router: Router;
    private projectController: ProjectController;

    constructor() {
        this.router = Router();
        this.projectController = new ProjectController();
        this.initializeRoutes();
    }

    /**
     * Bind controller methods to specific route endpoints
     */
    private initializeRoutes() {
        // e.g., POST /api/v1/projects/create
        this.router.post('/create', this.projectController.createProject);
        
        // e.g., GET /api/v1/projects/
        this.router.get('/', this.projectController.getAllProjects);
        
        // e.g., DELETE /api/v1/projects/:id
        this.router.delete('/:id', this.projectController.deleteProject);
    }
}