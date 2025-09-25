// DIAGNOSE CHUNKING PROBLEM
const { Pinecone } = require('@pinecone-database/pinecone');

async function diagnoseChunking() {
  const pc = new Pinecone({
    apiKey: 'pcsk_zjRtz_Kw4oDNKND6KSWMBkD5iyhc3T1jRbH8pFmmHi1wiGJM71W6jv32266sEjdh8FDQZ',
  });
  
  const index = pc.index('nibrs-chatbot');
  
  console.log('🔍 DIAGNOSING CHUNKING ISSUES\n');
  
  // Get a larger sample to see what's actually stored
  const sample = await index.query({
    vector: Array(1536).fill(0.01),
    topK: 20, // Get more samples
    includeMetadata: true,
    includeValues: false
  });
  
  console.log(`📊 Retrieved ${sample.matches.length} chunks for analysis\n`);
  
  // Analyze chunk diversity
  const chunkPatterns = new Set();
  const chunkStarts = new Map();
  
  sample.matches.forEach((match, i) => {
    const text = match.metadata?.text || '';
    const firstLine = text.split('\n')[0]?.substring(0, 50) || 'Empty';
    const firstWords = text.split(' ').slice(0, 5).join(' ');
    
    chunkPatterns.add(firstWords);
    chunkStarts.set(i, firstLine);
  });
  
  console.log('🔄 UNIQUE CHUNK STARTS FOUND:');
  chunkStarts.forEach((start, index) => {
    console.log(`Chunk ${index + 1}: "${start}..."`);
  });
  
  console.log(`\n📈 CHUNK DIVERSITY: ${chunkPatterns.size} unique patterns out of ${sample.matches.length} chunks`);
  
  if (chunkPatterns.size <= 3) {
    console.log('❌ CRITICAL: Very low chunk diversity! Chunking may have failed.');
    console.log('💡 Solution: Re-upload with better chunking settings');
  } else if (chunkPatterns.size <= 10) {
    console.log('⚠️  WARNING: Limited chunk diversity. Some content may be missing.');
  } else {
    console.log('✅ GOOD: Healthy chunk diversity detected.');
  }
  
  // Check chunk sizes
  const chunkSizes = sample.matches.map(m => m.metadata.text?.length || 0);
  const avgSize = chunkSizes.reduce((a, b) => a + b, 0) / chunkSizes.length;
  
  console.log(`\n📏 AVERAGE CHUNK SIZE: ${avgSize.toFixed(0)} characters`);
  console.log(`📏 SIZE RANGE: ${Math.min(...chunkSizes)} - ${Math.max(...chunkSizes)} characters`);
  
  if (avgSize > 2000) {
    console.log('❌ Chunks are too large! Ideal is 500-1500 characters.');
  }
}

diagnoseChunking();