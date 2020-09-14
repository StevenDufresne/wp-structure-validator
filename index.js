const io = require('@actions/io');

try {

    const awaitStyle = io.exists('style.css');

    console.log(awaitStyle);
    
    const awaitNonExists = io.exists('nomatch.css');

    console.log( awaitNonExists);

} catch (error) {
    console.log(error);
}
