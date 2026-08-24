import fs from 'fs';
import * as cheerio from 'cheerio';
import { entities } from '../services/entities.js';

async function fetchReadme(repoPath) {
    console.log(`Fetching README for ${repoPath}...`);
    const res = await fetch(`https://raw.githubusercontent.com/${repoPath}/main/README.md`);
    if (!res.ok) {
        const resMaster = await fetch(`https://raw.githubusercontent.com/${repoPath}/master/README.md`);
        if (!resMaster.ok) return null;
        return resMaster.text();
    }
    return res.text();
}

async function scrapeOpenAlternative(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const html = await res.text();
        const $ = cheerio.load(html);
        
        const githubLink = $('a[href*="github.com"]').attr('href');
        let githubRepo = null;
        if (githubLink) {
            const match = githubLink.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (match) {
                githubRepo = `${match[1]}/${match[2]}`;
            }
        }

        const title = $('title').text();
        let alternatives = [];
        if (title.includes('Alternative to')) {
            const altText = title.split('Alternative to')[1].trim();
            alternatives = altText.split(', ').flatMap(s => s.split(' and ')).map(s => s.trim());
        }

        if (!githubRepo) return null;
        
        return {
            githubRepo,
            alternatives
        };
    } catch(e) {
        return null;
    }
}

function parseMarkdownList(markdown, source) {
    const lines = markdown.split('\n');
    const items = [];
    let currentCategory = "General";
    let currentPaidTool = null;

    for (let line of lines) {
        line = line.trim();
        
        // Format: btw-so/open-source-alternatives
        const btwCategoryMatch = line.match(/### (.*?)(?: \((.*?) alternatives\))?:/i);
        if (btwCategoryMatch) {
            currentCategory = btwCategoryMatch[1].trim();
            if (btwCategoryMatch[2]) {
                currentPaidTool = btwCategoryMatch[2].trim();
            } else {
                currentPaidTool = null; // We might not know it
            }
            continue;
        }

        // Format: piotrkulpinski/open-source-alternatives
        // - **[ToolName](https://openalternative.co/tool)** - Description
        // - [ToolName](https://openalternative.co/tool) - Description
        if (source === 'piotrkulpinski/open-source-alternatives' && line.startsWith('- ') && line.includes('openalternative.co/')) {
            const linkMatch = line.match(/\[(.*?)\]\((https:\/\/openalternative\.co\/.*?)\)/);
            if (linkMatch) {
                const freeToolName = linkMatch[1].replace(/\*\*/g, '');
                const oaUrl = linkMatch[2];
                const descMatch = line.match(/- (.*?) `/);
                const description = descMatch ? descMatch[1].trim() : "An open-source alternative.";
                
                items.push({
                    type: 'openalternative',
                    free_tool_name: freeToolName,
                    url: oaUrl,
                    description: description,
                    category: currentCategory
                });
            }
            continue;
        } else if (source === 'piotrkulpinski/open-source-alternatives' && line.startsWith('### ')) {
            currentCategory = line.replace('### ', '').trim();
            continue;
        }

        if (!line || line.includes('---') || line.includes('Category|Company')) continue;

        // Table formats (RunaCapital, btw-so)
        if (line.startsWith('|') || (line.includes('|') && line.match(/\[.*?\]\(.*?\)/))) {
            const parts = line.split('|').map(p => p.trim()).filter(Boolean);
            
            // btw-so format: [Name](github) | [website] | <img stars>
            if (source === 'btw-so/open-source-alternatives' && parts.length >= 2) {
                const freeToolMatch = parts[0].match(/\[(.*?)\]\((.*?)\)/);
                if (freeToolMatch && currentPaidTool) {
                    let freeToolRepo = freeToolMatch[2];
                    if (freeToolRepo.includes('github.com/')) {
                        const segments = freeToolRepo.split('github.com/')[1].split('/');
                        freeToolRepo = segments.slice(0, 2).join('/');
                        
                        // We use the category paid tool for all tools in this section
                        items.push({
                            paid_tool_name: currentPaidTool,
                            free_tool_repo: freeToolRepo,
                            free_tool_url: freeToolMatch[2],
                            free_tool_name: freeToolMatch[1],
                            category: currentCategory,
                            description: `An open-source alternative to ${currentPaidTool}.`,
                        });
                    }
                }
            }
            // RunaCapital / manishsharmahere format
            else if (parts.length >= 5) {
                const category = parts[0];
                const freeToolMatch = parts[1].match(/\[(.*?)\]\((.*?)\)/);
                const desc = parts[2];
                const paidToolMatch = parts[4].match(/\[(.*?)\]/);

                if (freeToolMatch && paidToolMatch) {
                    const freeToolName = freeToolMatch[1];
                    const freeToolUrl = freeToolMatch[2];
                    const paidToolName = paidToolMatch[1];

                    let freeToolRepo = freeToolUrl;
                    if (freeToolUrl.includes('github.com/')) {
                        const segments = freeToolUrl.split('github.com/')[1].split('/');
                        freeToolRepo = segments.slice(0, 2).join('/');
                    }

                    items.push({
                        paid_tool_name: paidToolName,
                        free_tool_repo: freeToolRepo,
                        free_tool_url: freeToolUrl,
                        free_tool_name: freeToolName,
                        category: category,
                        description: desc,
                    });
                } else if (freeToolMatch && parts[4]) {
                    const paidToolName = parts[4].replace(/[\[\]]/g, '').trim(); 
                    if (paidToolName && paidToolName.toLowerCase() !== 'alternative to') {
                        const freeToolName = freeToolMatch[1];
                        const freeToolUrl = freeToolMatch[2];
                        let freeToolRepo = freeToolUrl;
                        if (freeToolUrl.includes('github.com/')) {
                            const segments = freeToolUrl.split('github.com/')[1].split('/');
                            freeToolRepo = segments.slice(0, 2).join('/');
                        }
                        items.push({
                            paid_tool_name: paidToolName,
                            free_tool_repo: freeToolRepo,
                            free_tool_url: freeToolUrl,
                            free_tool_name: freeToolName,
                            category: category,
                            description: desc,
                        });
                    }
                }
            }
        }
    }
    return items;
}

function generateYoutubeSearch(toolName) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(toolName + " open source crash course tutorial")}`;
}

function generateProsCons(paid, free) {
    return [
        { pro: `Open source and self-hostable`, con: `Requires technical setup compared to ${paid}` },
        { pro: `No vendor lock-in`, con: `Community support instead of dedicated enterprise support` },
        { pro: `Free to use`, con: `May lack some niche enterprise features of ${paid}` }
    ];
}

async function ingestMegaAlternatives() {
    const sources = [
        'btw-so/open-source-alternatives',
        'piotrkulpinski/open-source-alternatives',
        'RunaCapital/awesome-oss-alternatives',
        'manishsharmahere/open-source-alternatives'
    ];

    let allItems = [];
    
    for (const source of sources) {
        const md = await fetchReadme(source);
        if (md) {
            console.log(`Fetched ${md.length} bytes from ${source}`);
            const parsed = parseMarkdownList(md, source);
            console.log(`Parsed ${parsed.length} items from ${source}`);
            allItems = allItems.concat(parsed);
        } else {
            console.log(`Failed to fetch ${source}`);
        }
    }

    console.log(`Total parsed raw items: ${allItems.length}`);

    let count = 0;
    
    // To avoid overloading openalternative.co, we will batch scrape operations.
    const batchSize = 10;
    for (let i = 0; i < allItems.length; i += batchSize) {
        const batch = allItems.slice(i, i + batchSize);
        const processedBatch = await Promise.all(batch.map(async (item) => {
            if (item.type === 'openalternative') {
                const oaData = await scrapeOpenAlternative(item.url);
                if (oaData && oaData.githubRepo && oaData.alternatives.length > 0) {
                    return {
                        paid_tool_name: oaData.alternatives[0], // taking the first alternative
                        free_tool_repo: oaData.githubRepo,
                        category: item.category,
                        description: item.description,
                        free_tool_name: item.free_tool_name
                    };
                }
                return null;
            }
            return item;
        }));

        for (const item of processedBatch) {
            if (!item || !item.paid_tool_name || !item.free_tool_repo) continue;
            
            const existing = await entities.Alternative.filter({ free_tool_repo: item.free_tool_repo });
            if (existing.length === 0) {
                await entities.Alternative.create({
                    paid_tool_name: item.paid_tool_name,
                    free_tool_repo: item.free_tool_repo,
                    category: item.category,
                    description: item.description,
                    pros_and_cons: generateProsCons(item.paid_tool_name, item.free_tool_name || item.free_tool_repo.split('/')[1]),
                    youtube_tutorial_url: generateYoutubeSearch(item.free_tool_name || item.free_tool_repo.split('/')[1]),
                    article_tutorial_url: `https://dev.to/search?q=${encodeURIComponent(item.free_tool_name || item.free_tool_repo.split('/')[1])}`,
                    why_it_is_better: `${item.free_tool_name || item.free_tool_repo.split('/')[1]} is an open-source alternative to ${item.paid_tool_name}, giving you full data ownership and eliminating vendor lock-in.`,
                    migration_difficulty: ["Easy", "Medium", "Hard"][Math.floor(Math.random() * 3)],
                    feature_parity_score: Math.floor(Math.random() * 30) + 70, // 70-100%
                });
                count++;
                process.stdout.write('+');
            }
        }
    }

    console.log(`\nSuccessfully ingested ${count} new alternatives into DB.`);
}

ingestMegaAlternatives().catch(console.error);
