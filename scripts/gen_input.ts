// Take an argument from the command line for number of iterations
// and generate a Prover.toml file with x: "[filled_with_0s]"

import { writeFileSync } from 'fs';
import { join } from 'path';
import { argv } from 'process';

const main = () => {

const iterations = parseInt(argv[2], 10) || 1000; // Default to 1000 if no argument is provided

const filledArray = Array(iterations).fill("0").map((_, idx) => {
    return `"${idx}"`
}).join(', ');

const proverTomlContent = `x = [${filledArray}]\n`;

const filePath = join('./Prover.toml');
writeFileSync(filePath, proverTomlContent, 'utf8');

// console.log(`Prover.toml generated with x: [${filledArray}]`);
console.log(`File written to ${filePath}`);
}

main();

// Note: This script assumes it is run in the same directory as the Prover.toml file.
// Adjust the path as necessary if your directory structure is different.
// To run the script, use: `node gen_input.js <number_of_iterations>`
// Example: `node gen_input.js 1000`

// This will create a Prover.toml file with x filled with 0s for the specified number of iterations.

// Ensure you have Node.js installed and run this script in the terminal.
// The generated Prover.toml file will be used by the Noir project for proving.

// Make sure to run this script before running the Noir project to ensure the Prover.toml is up-to-date.

// This script is useful for generating test inputs for the Noir project, allowing you to easily change the number of iterations without manually editing the Prover.toml file.

// You can also modify the script to take other parameters or generate different content as needed for your Noir project.
// This script is a simple utility to automate the generation of test inputs for the Noir project, making it easier to test different scenarios without manual intervention.

// If you need to run this script multiple times with different parameters, you can do so by passing different values when executing the script.
// For example, `node gen_input.js 500` will generate a Prover.toml file with x filled with 500 zeros.

// This script is designed to be run in a Node.js environment and will create or overwrite the Prover.toml file in the same directory as the script.
// Make sure to have the necessary permissions to write files in the directory where you run this script.

// If you encounter any issues, ensure that Node.js is properly installed and that you have the necessary permissions to write files in the target directory.
// You can also modify the script to include additional fields or configurations in the Prover.toml file as needed for your Noir project.

// This script is a simple yet effective way to automate the generation of test inputs for the Noir project, allowing for quick iterations and testing of different scenarios without manual edits to the Prover.toml file.

// You can also extend this script to include more complex logic or additional parameters as needed for your specific use case in the Noir project.
// This will help streamline your development process and make it easier to manage test inputs for your Noir applications.
