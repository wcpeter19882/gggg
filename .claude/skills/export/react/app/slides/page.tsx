'use client';

/**
 * Slides Index Page
 * 
 * Lists available projects from the content-manager folder.
 * Click on a project to view its slides at /slides/{projectId}
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  slideCount?: number;
  theme?: string;
}

interface ApiResponse {
  projects: Project[];
  basePath: string;
  error?: string;
}

export default function SlidesIndexPage(): JSX.Element {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [basePath, setBasePath] = useState<string>('');

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch('/api/slides/projects');
        if (!response.ok) {
          throw new Error(`Failed to load projects: ${response.statusText}`);
        }
        
        const data: ApiResponse = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setProjects(data.projects || []);
        setBasePath(data.basePath || '');
        setLoading(false);
      } catch (err) {
        console.error('Failed to load projects:', err);
        setError(err instanceof Error ? err.message : 'Failed to load projects');
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <div className="text-red-500 text-xl mb-4">Error: {error}</div>
        <div className="text-gray-400 text-sm">
          Make sure the content-manager folder exists
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Slide Projects</h1>
        <p className="text-gray-400 text-sm mb-8">
          Base path: <code className="bg-gray-800 px-2 py-1 rounded">{basePath}</code>
        </p>
        
        {projects.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">No projects found</p>
            <p className="text-gray-500 text-sm mt-2">
              Create a project using the content-manager pipeline
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/slides/${project.id}`}
                className="block bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{project.name}</h2>
                    <p className="text-gray-400 text-sm mt-1">ID: {project.id}</p>
                  </div>
                  <div className="text-right">
                    {project.slideCount !== undefined && (
                      <span className="text-blue-400">{project.slideCount} slides</span>
                    )}
                    {project.theme && (
                      <p className="text-gray-500 text-sm">Theme: {project.theme}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
