#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse RSS XML and extract items
function parseRSS(xmlText) {
	// Use a simple XML parser since we're in Node.js
	const items = [];
	const itemRegex = /<item>([\s\S]*?)<\/item>/g;
	let match;

	while ((match = itemRegex.exec(xmlText)) !== null) {
		const itemContent = match[1];
		
		// Extract fields using regex
		const title = (itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || 
					  itemContent.match(/<title>(.*?)<\/title>/))?.[1] || '';
		
		const link = itemContent.match(/<link>(.*?)<\/link>/)?.[1] || '';
		
		const description = (itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
							itemContent.match(/<description>(.*?)<\/description>/))?.[1] || '';
		
		const pubDate = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
		
		// Extract image from enclosure tag (handle both type="image/..." orders)
		const enclosureMatch = itemContent.match(/<enclosure[^>]*type="image[^"]*"[^>]*url="([^"]*)"/) || 
							   itemContent.match(/<enclosure[^>]*url="([^"]*)"[^>]*type="image[^"]*"/);
		const image = enclosureMatch?.[1] || null;

		// Clean description text
		const cleanDescription = description
			.replace(/<[^>]*>/g, '') // Remove HTML tags
			.trim();

		// Truncate if too long
		const finalDescription = cleanDescription.length > 150
			? cleanDescription.substring(0, 150) + '...'
			: cleanDescription;

		items.push({
			title,
			link,
			description: finalDescription,
			pubDate: new Date(pubDate).toISOString(),
			image
		});
	}

	// Sort by date (newest first) and skip the first item, then take 2
	return items
		.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
		.slice(1, 3);
}

// Fetch RSS feed
async function fetchRSSFeed() {
	try {
		console.log('Fetching RSS feed from diagramchasing.fun...');
		
		const response = await fetch('https://diagramchasing.fun/rss.xml');
		
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		
		const xmlText = await response.text();
		const feedItems = parseRSS(xmlText);
		
		// Write to JSON file
		const outputPath = join(__dirname, '../src/lib/data/rss-feed.json');
		const output = {
			lastUpdated: new Date().toISOString(),
			items: feedItems
		};
		
		writeFileSync(outputPath, JSON.stringify(output, null, 2));
		
		console.log(`✅ Successfully fetched ${feedItems.length} RSS items`);
		console.log(`📄 Written to: ${outputPath}`);
		
		// Log the items for verification
		feedItems.forEach((item, index) => {
			console.log(`${index + 1}. ${item.title} (${new Date(item.pubDate).toLocaleDateString()})`);
		});
		
	} catch (error) {
		console.error('❌ Error fetching RSS feed:', error.message);
		
		// Create a fallback file with error info
		const outputPath = join(__dirname, '../src/lib/data/rss-feed.json');
		const fallback = {
			lastUpdated: new Date().toISOString(),
			error: error.message,
			items: []
		};
		
		writeFileSync(outputPath, JSON.stringify(fallback, null, 2));
		console.log('📄 Created fallback file with error info');
		
		process.exit(1);
	}
}

// Run the script
fetchRSSFeed();