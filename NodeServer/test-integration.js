const Product = require('./models/ProductPostgres');

async function testProductWithImages() {
  console.log('🔍 Testing product integration with image URLs...\n');
  
  try {
    // Get some products
    const products = await Product.search('', { limit: 3 });
    
    console.log(`Found ${products.length} products:`);
    
    products.forEach((product, index) => {
      const productJson = product.toJSON();
      console.log(`\n${index + 1}. Product: ${productJson.name}`);
      console.log(`   Item Code: ${productJson.item_code}`);
      console.log(`   Image URL: ${productJson.image_url}`);
      console.log(`   Has Image URL: ${productJson.image_url ? '✅ YES' : '❌ NO'}`);
    });
    
    console.log('\n✅ Integration test completed!');
    console.log('\n💡 Now the React frontend should receive image_url for each product');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testProductWithImages(); 