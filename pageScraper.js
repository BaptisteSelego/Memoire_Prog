const puppeteer = require('puppeteer-core');

// Liste des mots clés à détecter
const keywords = [
  'Agile', 'Scrum', 'Kanban', 'Lean', 'Iterative', 'Incremental', 'Sprint', 'Stand-up meeting', 'Daily scrum', 'Backlog',
  'User stories', 'Continuous integration', 'Continuous delivery', 'Continuous deployment', 'Retrospective', 'Burn down chart',
  'Velocity', 'MVP', 'Product owner', 'Scrum master', 'Cross-functional team', 'Adaptive planning', 'Test-driven development',
  'Behavior-driven development', 'Pair programming', 'DevOps', 'Collaborative', 'Flexibility', 'Customer feedback', 'Incremental delivery',
  'Agile manifesto', 'Agile principles', 'Self-organizing team', 'Rapid prototyping', 'Just-in-time development', 'Iteration planning',
  'Task board', 'Story points', 'Planning poker', 'Agile coach', 'Release planning', 'Agile transformation', 'Agile adoption',
  'Agile practices', 'Timeboxing', 'Epics', 'Themes', 'Features', 'Acceptance criteria', 'Definition of done', 'Workflow',
  'Agile framework', 'Adaptive approach', 'Agile methodology', 'Project management', 'Collaboration tools', 'Agile culture',
  'Team autonomy', 'Agile tools', 'Feedback loop', 'Iterative development', 'Process improvement', 'Agile process',
  'Agile strategy', 'Agile project management', 'Customer-centric', 'Agile mindset', 'Agile environment', 'Agile development', 'Agile lifecycle'
];

async function getAllLinks(page, url) {
    const links = new Set();
    try {
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Attendre que des liens soient présents dans le DOM
        await page.waitForSelector('a');

        const baseURL = new URL(url);

        // Extraire les liens
        const anchors = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a')).map(a => a.href);
        });

        console.log("Anchors found:", anchors);

        anchors.forEach(link => {
            try {
                
                const absoluteLink = new URL(link, baseURL).href;
                links.add(absoluteLink);
                console.log(`Link added: ${absoluteLink}`);
                
            } catch (e) {
                console.error(`Invalid URL: ${link}, Error: ${e.message}`);
            }
        });

    } catch (error) {
        console.error(`Error navigating to ${url}: ${error.message}`);
    }

    const extractedLinks = Array.from(links);
    console.log(`Extracted links from ${url}: ${extractedLinks.length > 0 ? extractedLinks : 'No links found'}`);
    console.log('Finished extracting links.');
    return extractedLinks;
}

async function detectKeywords(page) {
    const pageText = await page.evaluate(() => document.body.innerText);
    return keywords.filter(keyword => pageText.includes(keyword));
}

async function crawlSite(browser, startUrl) {
    const page = await browser.newPage();  
    const visitedLinks = new Set();
    const linksToVisit = new Set([startUrl]);
    const results = [];
    let linksVisitedCount = 0; // Compteur de liens visités
  
    try {
      while (linksToVisit.size > 0) {
        const currentUrl = linksToVisit.values().next().value;
        linksToVisit.delete(currentUrl);

        if ((visitedLinks.size + linksToVisit.size) > 100) {
          console.log('Reached the limit of 100 links. Exiting...');
          break;
        }
  
        if (!visitedLinks.has(currentUrl)) {
          visitedLinks.add(currentUrl);
          console.log(`Visiting: ${currentUrl}`);
          linksVisitedCount++; // Incrémenter le compteur
  
          try {
            const newLinks = await getAllLinks(page, currentUrl);

            console.log(`Found new links on ${currentUrl}: ${newLinks}`);
            newLinks.forEach(link => {
              if (!visitedLinks.has(link)) {
                linksToVisit.add(link);
              }
            });
  
            const foundKeywords = await detectKeywords(page);
            if (foundKeywords.length > 0) {
              console.log(`Keywords found on ${currentUrl}: ${foundKeywords.join(', ')}`);
              results.push({ url: currentUrl, keywords: foundKeywords });
            } else {
              console.log(`No specified keywords found on ${currentUrl}`);
            }
          } catch (error) {
            console.error(`Error processing ${currentUrl}: ${error.message}`);
          }
        } else {
          console.log(`Already visited: ${currentUrl}`);
        }
      }
    } catch (error) {
      console.error(`Error during crawling site: ${error.message}`);
    } finally {
      await page.close();
    }
  
    console.log(`Crawling completed. Visited ${linksVisitedCount} links.`);
    return { results, linksVisitedCount }; // Retourner les résultats et le compteur
}

  
  
const scraperObject = {
  url: 'https://www.crowdcube.eu/login?redirect_to=L2ZyLWZyLw%3D%3D&country=FR',
  async scraper(browser) {
    let page = await browser.newPage();
    console.log(`Navigating to ${this.url}...`);
    await page.goto(this.url);

    try {
      const frameHandle = await page.$('iframe');
      if (frameHandle) {
        const frame = await frameHandle.contentFrame();
        if (frame) {
          const acceptCookiesButtonSelector = '#onetrust-accept-btn-handler';
          await frame.waitForSelector(acceptCookiesButtonSelector, { timeout: 10000 });
          await frame.click(acceptCookiesButtonSelector);
        } else {
          console.error('Frame handle found but content frame is null');
        }
      } else {
        const acceptCookiesButtonSelector = '#onetrust-accept-btn-handler';
        await page.waitForSelector(acceptCookiesButtonSelector, { timeout: 10000 });
        await page.click(acceptCookiesButtonSelector);
      }

      const loginSelector = 'input[type="text"][id="email-address"]';
      const loginText = "baptisteperichaud@hotmail.com";
      await page.waitForSelector(loginSelector, { timeout: 10000 });
      await page.type(loginSelector, loginText);

      const passwordSelector = 'input[type="password"][id="password"]';
      const passwordText = "Perichaud-2001";
      await page.waitForSelector(passwordSelector, { timeout: 10000 });
      await page.type(passwordSelector, passwordText);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const nextButtonSelector = 'button[type="submit"][data-analytics="login-button"]';
      await page.waitForSelector(nextButtonSelector, { timeout: 10000 });
      await page.click(nextButtonSelector);

      const companiesLinkSelector = 'a[target="_self"].sc-empnci.bWtxoP[href="/companies"]';
      await page.waitForSelector(companiesLinkSelector);
      await page.click(companiesLinkSelector);

      await page.waitForNavigation({ waitUntil: 'networkidle0' });

      const loadMoreButtonSelector = 'button#loadMoreCompanies.button.secondary.cc-pagination__load';
      let clickCount = 0;

      while (true) {
          try {
              await page.waitForSelector(loadMoreButtonSelector, { timeout: 10000 });
              const loadMoreButton = await page.$(loadMoreButtonSelector);
              if (loadMoreButton) {
                  const boundingBox = await loadMoreButton.boundingBox();
                  if (boundingBox) {
                      await loadMoreButton.click();
                      clickCount++;
                      console.log(`page étendue ${clickCount} fois`);
                      // Wait for new content to load
                      await new Promise(resolve => setTimeout(resolve, 1000));
                  } else {
                      break;
                  }
              } else {
                  break;
              }
          } catch (error) {
              console.error('Load more button not found or not clickable:', error.message);
              break;
          }
      }

      console.log('Extension de la page terminée');
      // Attendre la navigation après le clic sur le lien "companies"




      const data = await page.evaluate(() => {
        if (typeof document !== 'undefined') {
          const containerElements = document.querySelectorAll('.cc-grid__cell');
          return Array.from(containerElements).map(container => {
          
            const nameElement = container.querySelector('h1');
            const name = nameElement ? nameElement.textContent.trim() : 'No name found';

            const raisedElement = container.querySelector('.cc-inlineStats__group dd.cc-inlineStats__value');
            const raised = raisedElement ? raisedElement.textContent.trim() : 'No amount found';

            const linkElement = container.querySelector('a.cc-card__link');
            const link = linkElement ? `https://www.crowdcube.eu${linkElement.getAttribute('href')}` : 'No link found';
        

            return {
              name: name,
              amount_raised: raised,
              link: link,
            };
          });
        } else {
          return 'Document is not defined';
        }
        })

      console.log('Data extracted:', data);
      for (const item of data) {
        if (item.link !== 'No link found') {
            console.log(`Opening new tab for ${item.link}`);
            try {
                const newPage = await browser.newPage();
                await newPage.goto(item.link, { waitUntil: 'networkidle2', timeout: 60000 });
    
                const elementFound = await newPage.evaluate(() => {
                    const element = document.querySelector('span.cc-iconLabel__label');
                    if (element && element.textContent.trim() === 'Website') {
                        const linkElement = element.closest('a');
                        if (linkElement && linkElement.href) {
                            return { href: linkElement.href }; // Retourne le href du lien
                        }
                    }
                    return false;
                });
    
                if (elementFound) {
                    console.log('Element found on', item.link);
                    console.log('Opening link:', elementFound.href);
                    const { results, linksVisitedCount } = await crawlSite(browser, elementFound.href);
    
                    // Nouveau format des résultats
                    const keywordCount = {};
                    results.forEach(result => {
                        result.keywords.forEach(keyword => {
                            if (keywordCount[keyword]) {
                                keywordCount[keyword]++;
                            } else {
                                keywordCount[keyword] = 1;
                            }
                        });
                    });
    
                    item.results = Object.keys(keywordCount).map(keyword => ({
                        numbers: keywordCount[keyword],
                        keywords: [keyword]
                    }));
    
                    item.linksVisitedCount = linksVisitedCount;
                    item.linkElementHref = elementFound.href; // Ajoute le href du lien
                    console.log(`Total visited pages with keywords: ${results.length}`);
                    results.forEach(result => console.log(`URL: ${result.url}, Keywords: ${result.keywords.join(', ')}`));
                    console.log(`Total links visited for ${item.link}: ${linksVisitedCount}`);
                    console.log("site finis");
                } else {
                    console.log('Element not found on', item.link);
                    data = data.filter(d => d !== item);
                }
    
                await newPage.close();
    
            } catch (error) {
                console.error(`Failed to open ${item.link}: ${error.message}`);
                item.email = 'NA';
                item.address = 'Address not found';
                item.sector = 'Sector not found';
                item.categorie = 'Category not found';
                item.presentation = 'Presentation not found';
            }
        } else {
            item.email = 'NA';
            item.address = 'Address not found';
            item.sector = 'Sector not found';
            item.categorie = 'Category not found';
            item.presentation = 'Presentation not found';
        }
    }
    
    return data;

    } catch (error) {
      console.error(`Error: ${error.message}`);
    } finally {
      await page.close(); // Fermer la page principale à la fin
    }
  }
};

module.exports = scraperObject;
