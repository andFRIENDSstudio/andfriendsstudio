// src/pages/api/dedupe-images.ts
import type { APIRoute } from 'astro';
import { list, del } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';

export const prerender = false;

interface DuplicateGroup {
  originalFilename: string;
  urls: string[];
  sizes: number[];
}

// GET - Show dry run results in browser
export const GET: APIRoute = async () => {
  try {
    console.log('Starting image deduplication dry run');
    
    // 1. List all blobs
    const { blobs } = await list({
      token: import.meta.env.BLOB_READ_WRITE_TOKEN,
    });
    
    console.log(`Found ${blobs.length} total blobs`);
    
    // 2. Group by original filename
    const groups = new Map<string, { urls: string[]; uploadedAt: Date[]; sizes: number[] }>();
    
    blobs.forEach(blob => {
      const match = blob.pathname.match(/^\d+-(.+)$/);
      const originalName = match ? match[1] : blob.pathname;
      
      if (!groups.has(originalName)) {
        groups.set(originalName, { urls: [], uploadedAt: [], sizes: [] });
      }
      
      const group = groups.get(originalName)!;
      group.urls.push(blob.url);
      group.uploadedAt.push(new Date(blob.uploadedAt));
      group.sizes.push(blob.size);
    });
    
    // 3. Find duplicates
    const duplicates: DuplicateGroup[] = [];
    
    groups.forEach((group, originalName) => {
      if (group.urls.length > 1) {
        duplicates.push({
          originalFilename: originalName,
          urls: group.urls,
          sizes: group.sizes,
        });
      }
    });
    
    console.log(`Found ${duplicates.length} duplicate groups`);
    
    // Generate HTML response
    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Image Deduplication Tool</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'JetBrains Mono', monospace; 
      background: #000; 
      color: #fff; 
      padding: 2rem;
    }
    h1 { 
      font-size: 1.5rem; 
      margin-bottom: 1rem; 
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .stats { 
      background: #111; 
      padding: 1rem; 
      margin-bottom: 2rem; 
      border: 1px solid #333;
    }
    .stats div { margin-bottom: 0.5rem; font-size: 0.875rem; }
    .duplicate-group { 
      background: #111; 
      padding: 1rem; 
      margin-bottom: 1rem; 
      border: 1px solid #333;
    }
    .duplicate-group h3 { 
      font-size: 1rem; 
      margin-bottom: 0.5rem; 
      color: #ff3b30;
    }
    .url-item { 
      font-size: 0.75rem; 
      padding: 0.5rem; 
      margin: 0.25rem 0;
      background: #000;
      border: 1px solid #222;
    }
    .keep { border-left: 3px solid #4caf50; }
    .delete { border-left: 3px solid #ff3b30; }
    button {
      background: #ff3b30;
      color: #fff;
      border: none;
      padding: 1rem 2rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      cursor: pointer;
      margin-top: 2rem;
    }
    button:hover { background: #ff5540; }
    button:disabled { background: #333; cursor: not-allowed; }
    .success { color: #4caf50; }
    .warning { color: #ff9800; }
  </style>
</head>
<body>
  <h1>&FRIENDS Image Deduplication</h1>
  
  <div class="stats">
    <div>Total blobs: ${blobs.length}</div>
    <div>Duplicate groups: ${duplicates.length}</div>
    <div>Files to delete: ${duplicates.reduce((sum, d) => sum + (d.urls.length - 1), 0)}</div>
  </div>
`;

    if (duplicates.length === 0) {
      html += '<div class="success">✓ No duplicates found!</div>';
    } else {
      duplicates.forEach((dup, i) => {
        html += `
  <div class="duplicate-group">
    <h3>Duplicate #${i + 1}: ${dup.originalFilename}</h3>
    <div style="margin-bottom: 0.5rem; font-size: 0.875rem;">${dup.urls.length} copies found</div>
`;
        
        dup.urls.forEach((url, j) => {
          const isKeep = j === dup.urls.length - 1;
          html += `
    <div class="url-item ${isKeep ? 'keep' : 'delete'}">
      ${isKeep ? '✓ KEEP' : '✗ DELETE'}: ${url}
    </div>`;
        });
        
        html += '</div>';
      });
      
      html += `
  <button onclick="executeDedupe()" id="dedupeBtn">
    [DELETE ${duplicates.reduce((sum, d) => sum + (d.urls.length - 1), 0)} DUPLICATES]
  </button>
  
  <script>
    async function executeDedupe() {
      const btn = document.getElementById('dedupeBtn');
      btn.disabled = true;
      btn.textContent = '[DELETING...]';
      
      try {
        const response = await fetch('/api/dedupe-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dryRun: false })
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert('✓ DELETED ' + result.deleted + ' DUPLICATES!');
          window.location.reload();
        } else {
          alert('✗ ERROR: ' + result.error);
          btn.disabled = false;
          btn.textContent = '[DELETE DUPLICATES]';
        }
      } catch (err) {
        alert('✗ ERROR: ' + err.message);
        btn.disabled = false;
        btn.textContent = '[DELETE DUPLICATES]';
      }
    }
  </script>
`;
    }
    
    html += '</body></html>';
    
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
    
  } catch (error) {
    console.error('Deduplication error:', error);
    return new Response(`
<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body style="font-family: monospace; padding: 2rem; background: #000; color: #fff;">
  <h1>ERROR</h1>
  <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
</body>
</html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { dryRun = true } = await request.json().catch(() => ({ dryRun: true }));
    
    console.log(`Starting image deduplication (dry run: ${dryRun})`);
    
    // 1. List all blobs
    const { blobs } = await list({
      token: import.meta.env.BLOB_READ_WRITE_TOKEN,
    });
    
    console.log(`Found ${blobs.length} total blobs`);
    
    // 2. Group by original filename (extract from timestamp-filename pattern)
    const groups = new Map<string, { urls: string[]; uploadedAt: Date[]; sizes: number[] }>();
    
    blobs.forEach(blob => {
      // Extract original filename from pattern: timestamp-originalname.ext
      const match = blob.pathname.match(/^\d+-(.+)$/);
      const originalName = match ? match[1] : blob.pathname;
      
      if (!groups.has(originalName)) {
        groups.set(originalName, { urls: [], uploadedAt: [], sizes: [] });
      }
      
      const group = groups.get(originalName)!;
      group.urls.push(blob.url);
      group.uploadedAt.push(new Date(blob.uploadedAt));
      group.sizes.push(blob.size);
    });
    
    // 3. Find duplicates (groups with more than 1 URL)
    const duplicates: DuplicateGroup[] = [];
    
    groups.forEach((group, originalName) => {
      if (group.urls.length > 1) {
        duplicates.push({
          originalFilename: originalName,
          urls: group.urls,
          sizes: group.sizes,
        });
      }
    });
    
    console.log(`Found ${duplicates.length} duplicate groups`);
    
    if (duplicates.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No duplicates found!',
        duplicates: [],
        deleted: [],
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 4. For each duplicate group, keep the newest upload and delete the rest
    const deleted: string[] = [];
    const kept: Map<string, string> = new Map(); // old URL -> new URL mapping
    
    for (const duplicate of duplicates) {
      // Find newest upload (last in array since uploadedAt is chronological)
      const newestUrl = duplicate.urls[duplicate.urls.length - 1];
      
      console.log(`Duplicate group: ${duplicate.originalFilename}`);
      console.log(`  Keeping: ${newestUrl}`);
      
      // Delete all except the newest
      for (let i = 0; i < duplicate.urls.length - 1; i++) {
        const oldUrl = duplicate.urls[i];
        console.log(`  ${dryRun ? 'Would delete' : 'Deleting'}: ${oldUrl}`);
        
        if (!dryRun) {
          await del(oldUrl, {
            token: import.meta.env.BLOB_READ_WRITE_TOKEN,
          });
        }
        
        deleted.push(oldUrl);
        kept.set(oldUrl, newestUrl);
      }
    }
    
    // 5. Update projects.json to point to kept URLs
    if (!dryRun && kept.size > 0) {
      const projectsPath = path.join(process.cwd(), 'src/data/projects.json');
      const projectsData = await fs.readFile(projectsPath, 'utf-8');
      const data = JSON.parse(projectsData);
      
      let updatedCount = 0;
      
      data.projects.forEach((project: any) => {
        if (project.image && kept.has(project.image)) {
          console.log(`Updating project "${project.title}": ${project.image} -> ${kept.get(project.image)}`);
          project.image = kept.get(project.image);
          updatedCount++;
        }
      });
      
      if (updatedCount > 0) {
        await fs.writeFile(projectsPath, JSON.stringify(data, null, 2));
        console.log(`Updated ${updatedCount} project image references`);
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      dryRun,
      duplicates: duplicates.map(d => ({
        filename: d.originalFilename,
        count: d.urls.length,
        urls: d.urls,
      })),
      deleted: deleted.length,
      updated: dryRun ? 'N/A (dry run)' : kept.size,
      message: dryRun 
        ? `DRY RUN: Found ${duplicates.length} duplicate groups (${deleted.length} files to delete). Run with dryRun=false to actually delete.`
        : `Deleted ${deleted.length} duplicate images and updated ${kept.size} project references.`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Deduplication error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to deduplicate images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};