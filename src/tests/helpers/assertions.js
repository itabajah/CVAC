/**
 * Test Assertions
 * Custom assertion functions for testing without external dependencies
 */

/**
 * Assert that a value equals expected
 */
function assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
        throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
    }
}

/**
 * Assert that a value is truthy
 */
function assertTrue(value, message = '') {
    if (!value) {
        throw new Error(`${message}\nExpected truthy value, got: ${JSON.stringify(value)}`);
    }
}

/**
 * Assert that a value is falsy
 */
function assertFalse(value, message = '') {
    if (value) {
        throw new Error(`${message}\nExpected falsy value, got: ${JSON.stringify(value)}`);
    }
}

/**
 * Assert that an array includes a value
 */
function assertIncludes(array, value, message = '') {
    if (!array.includes(value)) {
        throw new Error(`${message}\nExpected array to include: ${JSON.stringify(value)}\nArray: ${JSON.stringify(array)}`);
    }
}

/**
 * Assert that a function throws an error
 */
function assertThrows(fn, message = '') {
    let threw = false;
    try {
        fn();
    } catch (e) {
        threw = true;
    }
    if (!threw) {
        throw new Error(`${message}\nExpected function to throw an error`);
    }
}

/**
 * Assert that a string contains a substring
 */
function assertContains(str, substring, message = '') {
    if (!str.includes(substring)) {
        throw new Error(`${message}\nExpected string to contain: "${substring}"\nString: "${str.slice(0, 200)}..."`);
    }
}

/**
 * Assert that a path exists
 */
const fs = require('fs');

function assertPathExists(filePath, message = '') {
    if (!fs.existsSync(filePath)) {
        throw new Error(`${message}\nExpected path to exist: ${filePath}`);
    }
}

/**
 * Assert that a path does not exist
 */
function assertPathNotExists(filePath, message = '') {
    if (fs.existsSync(filePath)) {
        throw new Error(`${message}\nExpected path to NOT exist: ${filePath}`);
    }
}

/**
 * Assert deep equality for objects/arrays
 */
function assertDeepEqual(actual, expected, message = '') {
    const actualStr = JSON.stringify(actual, null, 2);
    const expectedStr = JSON.stringify(expected, null, 2);
    if (actualStr !== expectedStr) {
        throw new Error(`${message}\nExpected: ${expectedStr}\nActual: ${actualStr}`);
    }
}

/**
 * Assert that value is an array with specific length
 */
function assertArrayLength(array, length, message = '') {
    if (!Array.isArray(array)) {
        throw new Error(`${message}\nExpected an array, got: ${typeof array}`);
    }
    if (array.length !== length) {
        throw new Error(`${message}\nExpected array length: ${length}, got: ${array.length}`);
    }
}

/**
 * Assert that a value matches a regex
 */
function assertMatches(value, regex, message = '') {
    if (!regex.test(value)) {
        throw new Error(`${message}\nExpected value to match: ${regex}\nValue: ${value}`);
    }
}

module.exports = {
    assertEqual,
    assertTrue,
    assertFalse,
    assertIncludes,
    assertThrows,
    assertContains,
    assertPathExists,
    assertPathNotExists,
    assertDeepEqual,
    assertArrayLength,
    assertMatches
};
