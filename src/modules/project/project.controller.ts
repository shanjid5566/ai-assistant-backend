import type { Request, Response, NextFunction } from 'express';
import { ProjectService } from './project.service.js';

export class ProjectController {
    // Injecting the service dependency
    private projectService: ProjectService;

    constructor() {
        this.projectService = new ProjectService();
    }

    /**
     * Handles project creation request
     */
    public createProject = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.projectService.createProject(req.body);
            res.status(201).json({
                success: true,
                message: 'Project created successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Handles request to fetch all projects
     */
    public getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const email = req.query.email as string;
            const result = await this.projectService.getAllProjects(email);
            res.status(200).json({
                success: true,
                message: 'Projects retrieved successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Handles project deletion
     */
    public deleteProject = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await this.projectService.deleteProject(id);
            res.status(200).json({
                success: true,
                message: 'Project deleted successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
}