// src/pages/api/save-projects.ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const projects = body.projects;

    // GitHub API details
    const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
    const GITHUB_OWNER = import.meta.env.GITHUB_OWNER; // e.g., "yourusername"
    const GITHUB_REPO = import.meta.env.GITHUB_REPO;   // e.g., "andfriendsstudio"
    const FILE_PATH = 'src/data/projects.json';
    const BRANCH = 'main';

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
      return new Response(JSON.stringify({ 
        error: 'Missing GitHub configuration' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. Get current file SHA (required for updating)
    const getFileResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      }
    );

    if (!getFileResponse.ok) {
      throw new Error('Failed to fetch current file');
    }

    const fileData = await getFileResponse.json();
    const currentSHA = fileData.sha;

    // 2. Prepare new content
    const newContent = JSON.stringify({ projects }, null, 2);
    const encodedContent = Buffer.from(newContent).toString('base64');

    // 3. Commit the update
    const updateResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update projects via editor - ${new Date().toISOString()}`,
          content: encodedContent,
          sha: currentSHA,
          branch: BRANCH,
        })
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`GitHub API error: ${errorData.message}`);
    }

    const result = await updateResponse.json();

    return new Response(JSON.stringify({ 
      success: true,
      commit: result.commit.sha,
      message: 'Saved and committed to GitHub!'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Save error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to save',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};