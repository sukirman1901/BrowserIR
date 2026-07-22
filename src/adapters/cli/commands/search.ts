import { Command } from 'commander'
import Database from 'better-sqlite3'
import { ExaSearch } from '../../../engines/exa-search.js'

export function createSearchCommand(): Command {
  const search = new Command('search')
    .description('Semantic web search (like Exa)')

  search
    .command('query <text>')
    .description('Search with natural language')
    .option('-d, --domain <domain>', 'Filter by domain')
    .option('-i, --intent <intent>', 'Filter by intent')
    .option('-l, --limit <number>', 'Max results', '10')
    .action(async (text, options) => {
      const db = new Database('bir-search.db')
      try {
        const exaSearch = new ExaSearch(db)
        
        const results = await exaSearch.search(text, {
          domain: options.domain,
          intent: options.intent,
          limit: parseInt(options.limit)
        })

        console.log(`\nFound ${results.length} results:\n`)
        for (const result of results) {
          console.log(`  ${result.score.toFixed(2)} | ${result.title}`)
          console.log(`        ${result.url}`)
          console.log(`        Intent: ${result.intent.category}`)
          console.log('')
        }
      } catch (err) {
        console.error('Error:', err instanceof Error ? err.message : err)
        process.exit(1)
      } finally {
        db.close()
      }
    })

  search
    .command('crawl <url>')
    .description('Crawl URL and add to index')
    .action(async (url) => {
      const db = new Database('bir-search.db')
      try {
        const exaSearch = new ExaSearch(db)
        
        console.log(`Crawling ${url}...`)
        const result = await exaSearch.crawlAndIndex(url)
        
        if (result) {
          console.log(`\nIndexed: ${result.title}`)
          console.log(`URL: ${result.url}`)
          console.log(`Intent: ${result.intent.category}`)
        } else {
          console.log('Failed to crawl URL')
        }
      } catch (err) {
        console.error('Error:', err instanceof Error ? err.message : err)
        process.exit(1)
      } finally {
        db.close()
      }
    })

  search
    .command('stats')
    .description('Show search index statistics')
    .action(async () => {
      const db = new Database('bir-search.db')
      try {
        const exaSearch = new ExaSearch(db)
        
        const stats = await exaSearch.getStats()
        console.log('\nSearch Index Stats:')
        console.log(`  Total Pages: ${stats.totalPages}`)
        console.log(`  Total Domains: ${stats.totalDomains}`)
        console.log(`  Last Indexed: ${new Date(stats.lastIndexed).toISOString()}`)
      } catch (err) {
        console.error('Error:', err instanceof Error ? err.message : err)
        process.exit(1)
      } finally {
        db.close()
      }
    })

  return search
}
