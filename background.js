console.log("Background script loaded.")

async function downloadBangList(){
  try {
    const response = await fetch('https://duckduckgo.com/bang.js');
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.text();
    
  } catch (error) {
    console.error("Error fetching bang list:", error);
    throw error; 
  }
}

let bang_dictionary = null
async function get_bang_dictionary(){
  if (!bang_dictionary){ // Check for cached result
    data = await downloadBangList()
    const bang_list = data
    const bang_json = JSON.parse(bang_list)
  
    bang_dictionary = {}
    for (let i = 0; i < bang_json.length; i++){
      bang_dictionary[bang_json[i].t] = bang_json[i].d
    }
  }
  return bang_dictionary
}

// Returns an array of [bang, query_without_bang] if the query uses a bang and I'm feelin' lucky. Otherwise returns null.
async function get_query_data_if_well_formed(details){
  const url = new URL(details.url)
  const query = url.searchParams.get("q")

  // === EARLY RETURNS ===
  if (url.hostname !== 'duckduckgo.com') return null
  if (query == null || query[0] != "\\") return null // NOT FEELIN LUCKY
  
  // IF NO BANG
  let words = query.split(" ")
  let bang_with_prefix = words.find(str => str.startsWith('!'))
  if (!bang_with_prefix) return null
  let bang = bang_with_prefix.substring(1)

  // IF NOT A REAL BANG
  let dict = await get_bang_dictionary()
  if (!dict[bang]) return null;
  //===================

  words.splice(words.indexOf(bang_with_prefix), 1);
  const query_without_bang = words.join(' ')
  
  return [bang, query_without_bang]

}

query_data = null
async function redirect_if_necessary(details){
  query_data  = await get_query_data_if_well_formed(details)
  if (query_data) {
    [bang, query] = query_data
    let dict = await get_bang_dictionary()
    redirect_search = `https://duckduckgo.com/?q=${query} site:${dict[bang]}`
    return { redirectUrl: redirect_search };
  }
}

  browser.webRequest.onBeforeRequest.addListener(
    redirect_if_necessary,
    { urls: ["<all_urls>"] },
    ["blocking"]
  ); 