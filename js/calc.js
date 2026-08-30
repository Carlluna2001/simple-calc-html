// Access DOM elements of Calculator
const inputElem = document.getElementsByClassName('box')[0];
const expressionElem = document.getElementById('expression');
const resultElem = document.getElementById('result');
const lastOperatorElem = document.getElementById('lastOperator');

// Local variables to store the current expression and result
let currentExpression = '';
let currentResult = '';

// The display must start with 0, so we initialize the currentExpression to '0'
currentExpression = '0';
updateDisplay();

enableParticleAnimation();

function enableParticleAnimation() {
    
    const container = document.getElementById('particle-container');
    const particleCount = 50; // Adjust this number for more or fewer particles

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Randomize horizontal position (0% to 100%)
        particle.style.left = `${Math.random() * 100}%`;
        
        // Randomize animation delay so they don't all rise at once
        particle.style.animationDelay = `${Math.random() * 6}s`;
        
        // Optional: Randomize size slightly for depth
        const size = Math.random() * 4 + 2; // 2px to 6px
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Optional: Randomize duration slightly so they move at different speeds
        particle.style.animationDuration = `${Math.random() * 4 + 4}s`; // 4s to 8s

        container.appendChild(particle);
        
    }
}

function handleButtonClick(args) {
    const target = args.target;
    const action = target.dataset.action;
    const value = target.dataset.value;

    if(!action || !value) {
        return;
    }

    lastOperatorElem.textContent = '';
    switch (action) {
        case 'number':
            updateValue(value);
            break;
        case 'decimal':
            if (!value_before_last_operator().includes('.')) {
                updateValue(value);
            }
            break;
        case 'negate':
            toggleSign(currentExpression);
            break;
        case 'clear':
            clearDisplay();
            break;
          case 'backspace':
            backspace();
            break;
        case 'add':
        case 'subtract':
        case 'multiply':
        case 'division':
        case 'mod':
            if(currentExpression === '' && currentResult !== '') {
                moveResultToExpression(value);
            } else if (currentExpression !== '' && !lastCharIsOperator()) {
                updateValue(value);
            }
            break;
        case 'equals':
            calculateResult();
            break;
        default:
            console.warn('Unknown action:', action);
    }

    updateDisplay();
    if(action === 'equals') {
        // Move the result to the expression for further calculations
        currentExpression = currentResult;
        lastOperatorElem.textContent = '=';
    }
}

function updateValue(value) {
    // If current value is 0 or the new value is also 0, do not update the expression
    if (currentExpression === '0' || value === '0' && currentExpression === '0') {
        currentExpression = value;
    } else {
        currentExpression += value;
    }
}

function updateDisplay() {
    if (currentExpression === '') {
        currentExpression = '0';
        lastOperatorElem.textContent = '';
    }
    // hide separator if expression 0
    if (currentExpression === '0') {
        const separator = document.querySelector('.separator');
        const topRow = document.querySelector('.top-row');
        if (separator) {
            separator.style.display = 'none';
        }
        if (topRow) {            
            // remove the current dispaly fex
            topRow.style.display = 'block';
        }
    }
    expressionElem.textContent = format_number_from_expression(currentExpression);
    resultElem.textContent = format_number(currentResult);
}

function clearDisplay() {
    currentExpression = '';
    currentResult = '';
}

function format_number_from_expression(expression) {
    // 1. Create a reusable formatter for US English comma separation
    const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 20 });
    
    // 2. Find every standalone integer or decimal number in the string
    return expression.replace(/\d+(\.\d+)?/g, (match) => {
        // 3. Convert the matched string number to an actual number and format it
        return formatter.format(Number(match));
    });
}

function format_number(value) {
    const formatted = Number(value).toLocaleString('en-US');
    return value > 1000 ? formatted : value;
}

function backspace() {
    currentExpression = currentExpression.slice(0, -1);
}

function lastCharIsOperator() {
    const lastChar = currentExpression.slice(-1);
    return ['+', '-', 'x', '/', '%'].includes(lastChar);
}

function value_before_last_operator() {

    if(currentExpression.length === 0) return '0';

    // Split the string by any of the operators inside the brackets: +, -, x, /, or %
    const parts = currentExpression.split(/[+\-x/%]/);

    // Get the last item from the split array
    const lastNumberStr = parts[parts.length - 1]; 

    // Optional: Convert it from a string to an actual number
    return lastNumberStr;
}

function moveResultToExpression(value) {
    currentExpression = currentResult + value;
}

function calculateResult() {
    let result = new ExpressionParser(currentExpression).parse();
    // fix floating point precision issues
    result = parseFloat(result.toFixed(12));
    currentResult = result.toString();    
    // show separator if expression is not 0
    if (currentExpression !== '0') {
        const separator = document.querySelector('.separator');
        const topRow = document.querySelector('.top-row');
        if (separator) {
            separator.style.display = 'block';
        }
        if (topRow) {
            topRow.style.display = 'flex';
        }   
    }
}

inputElem.addEventListener('click', handleButtonClick);

class ExpressionParser {
    constructor(expression) {
        this.expression = expression;
        this.pos = 0;
    }

    parse() {
        const result = this.parseExpression();

        this.skipWhitespace();

        if (this.pos < this.expression.length) {
            throw new Error(
                `Unexpected character: ${this.expression[this.pos]}`
            );
        }

        return result;
    }

    // expression = term (("+" | "-") term)*
    parseExpression() {
        let result = this.parseTerm();

        while (true) {
            this.skipWhitespace();

            const op = this.expression[this.pos];

            if (op !== "+" && op !== "-") {
                break;
            }

            this.pos++;

            const value = this.parseTerm();

            if (op === "+") {
                result += value;
            } else {
                result -= value;
            }
        }

        return result;
    }

    parseTerm() {
        let result = this.parseFactor();

        while (true) {
            this.skipWhitespace();

            const op = this.expression[this.pos];

            if (op !== "x" && op !== "/" && op !== "%") {
                break;
            }

            this.pos++;

            const value = this.parseFactor();

            if (op === "x") {
                result *= value;
            }
            else if (op === "/") {
                if (value === 0) {
                    throw new Error("Division by zero");
                }

                result /= value;
            }
            else if (op === "%") {
                if (value === 0) {
                    throw new Error("Modulo by zero");
                }

                result %= value;
            }
        }

        return result;
    }

    // factor = ("+" | "-") factor | number | "(" expression ")" ["%"]
    parseFactor() {
        this.skipWhitespace();

        const char = this.expression[this.pos];

        // Unary + or -
        if (char === "+" || char === "-") {
            this.pos++;

            const value = this.parseFactor();

            return char === "-" ? -value : value;
        }

        // Parentheses
        if (char === "(") {
            this.pos++;

            const result = this.parseExpression();

            this.skipWhitespace();

            if (this.expression[this.pos] !== ")") {
                throw new Error("Missing closing parenthesis");
            }

            this.pos++;

            return result;
        }

        return this.parseNumber();
    }

    parseNumber() {
        this.skipWhitespace();

        const start = this.pos;

        while (
            this.pos < this.expression.length &&
            /[0-9.]/.test(this.expression[this.pos])
        ) {
            this.pos++;
        }

        if (start === this.pos) {
            throw new Error(
                `Expected number at position ${this.pos}`
            );
        }

        const value = Number(
            this.expression.substring(start, this.pos)
        );

        if (Number.isNaN(value)) {
            throw new Error("Invalid number");
        }

        return value;
    }

    skipWhitespace() {
        while (
            this.pos < this.expression.length &&
            /\s/.test(this.expression[this.pos])
        ) {
            this.pos++;
        }
    }

}

function toggleSign(expression) {
    expression = expression.trim();

    // Case 1: expression ends with a negated number: (-36)
    const negativeNumber = expression.match(/\(-(\d+(?:\.\d+)?)\)$/);

    if (negativeNumber) {
        const start = negativeNumber.index;

        // Remove "(-" and ")" → 36
        currentExpression = expression.slice(0, start) + negativeNumber[1];
        return;
    }

    // Case 2: expression ends with a positive number
    const number = expression.match(/(\d+(?:\.\d+)?)$/);

    if (!number) {
        currentExpression = expression;
        return;
    }

    const start = number.index;

    // Check for an existing unary minus
    if (start > 0 && expression[start - 1] === "-") {
        currentExpression = expression.slice(0, start - 1) + number[1];
        return;
    }

    // Wrap positive number as negative
    currentExpression = expression.slice(0, start) +
           "(-" + number[1] + ")";
}