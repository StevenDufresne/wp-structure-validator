const fs = require('fs');

try {

    const awaitStyle = fs.existsSync('style.css');

    console.log(awaitStyle);
    
    const awaitNonExists = fs.existsSync('nomatch.css');

    console.log( awaitNonExists );

} catch (error) {
    console.log(error);
}
