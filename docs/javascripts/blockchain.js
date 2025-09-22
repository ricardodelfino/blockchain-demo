/////////////////////////
// global variable setup
/////////////////////////

// This sets how difficult it is to mine a block
// number of zeros required at front of hash
// More zeros = more difficult = more time to mine
var difficultyMajor = 4;

// This is a fine-tuning for difficulty
// 0-15, maximum (decimal) value of the hex digit after the front
// 15 means any hex character is allowed next (easiest)
// 7  means next bit must be 0 (because 0x7=0111),
//    (so the bit-strength is doubled)
// 0  means only 0 can be next (hardest)
//    (equivalent to one more difficultyMajor)
var difficultyMinor = 15;  

// This limits how many attempts we'll make to find a valid hash
// We don't want to freeze the browser by mining forever
var maximumNonce = 8;  // limit the nonce so we don't mine too long
// Create the pattern of zeros that a valid hash must start with
// For example, if difficultyMajor is 4, pattern will be '0000'
var pattern = '';
for (var x=0; x<difficultyMajor; x++) {
  pattern += '0';     // every additional required 0
  maximumNonce *= 16; // takes 16x longer to mine
}
// at this point in the setup, difficultyMajor=4
// yields pattern '0000' and maximumNonce 8*16^4=524288

// Add one more hex-char for the minor difficulty
pattern += difficultyMinor.toString(16);
var patternLen = pattern.length; // == difficultyMajor+1

// Adjust maximumNonce based on difficultyMinor
// This ensures we have enough attempts for harder difficulties
if      (difficultyMinor == 0) { maximumNonce *= 16; } // 0000 require 4 more 0 bits
else if (difficultyMinor == 1) { maximumNonce *= 8;  } // 0001 require 3 more 0 bits
else if (difficultyMinor <= 3) { maximumNonce *= 4;  } // 0011 require 2 more 0 bits
else if (difficultyMinor <= 7) { maximumNonce *= 2;  } // 0111 require 1 more 0 bit
// else don't bother increasing maximumNonce, it already started with 8x padding



/////////////////////////
// functions
/////////////////////////
/**
 * Calculate a SHA256 hash of the contents of the block
 * 
 * @param {number} block - The block number
 * @param {number} chain - The chain number
 * @returns {string} - The SHA256 hash
 */
function sha256(block, chain) {
  // Get the text content of the block and hash it using the CryptoJS library
  // The getText function (defined elsewhere) extracts all the block data
  return CryptoJS.SHA256(getText(block, chain));
}

/**
 * Update the visual state of a block based on its hash
 * 
 * @param {number} block - The block number
 * @param {number} chain - The chain number
 */
function updateState(block, chain) {
  // Check if the hash meets our difficulty requirements
  // If it does, the block is valid (green), otherwise invalid (red)
  if ($('#block'+block+'chain'+chain+'hash').val().substr(0, patternLen) <= pattern) {
      // Valid block - show green background
      $('#block'+block+'chain'+chain+'well').removeClass('well-error').addClass('well-success');
  }
  else {
      // Invalid block - show red background
      $('#block'+block+'chain'+chain+'well').removeClass('well-success').addClass('well-error');
  }
}

/**
 * Update the hash value for a specific block
 * 
 * @param {number} block - The block number
 * @param {number} chain - The chain number
 */
function updateHash(block, chain) {
  // Calculate the new hash based on current block data
  $('#block'+block+'chain'+chain+'hash').val(sha256(block, chain));
  // Update the visual state (red/green) based on the new hash
  updateState(block, chain);
}

/**
 * Update all blocks in the chain starting from the specified block
 * 
 * @param {number} block - The starting block number
 * @param {number} chain - The chain number
 */
function updateChain(block, chain) {
  // This is a key blockchain concept! When one block changes,
  // all subsequent blocks must be updated because they depend on
  // the previous block's hash
  for (var x = block; x <= 5; x++) {
    if (x > 1) {
      // Set this block's 'previous hash' field to the hash of the previous block
      // This creates the chain of blocks - each one linked to the previous
      $('#block'+x+'chain'+chain+'previous').val($('#block'+(x-1).toString()+'chain'+chain+'hash').val());
    }
    // Update this block's hash
    updateHash(x, chain);
  }
}

/**
 * Mine a block by finding a nonce that produces a valid hash
 * 
 * @param {number} block - The block number to mine
 * @param {number} chain - The chain number
 * @param {boolean} isChain - Whether to update the entire chain after mining
 */
function mine(block, chain, isChain) {
  // Mining is the process of finding a nonce value that produces a hash
  // starting with the required number of zeros (meeting our difficulty)
  for (var x = 0; x <= maximumNonce; x++) {
    // Try each nonce value
    $('#block'+block+'chain'+chain+'nonce').val(x);
    // Calculate the hash with this nonce
    $('#block'+block+'chain'+chain+'hash').val(sha256(block, chain));
    
    // Check if this hash meets our difficulty requirement
    if ($('#block'+block+'chain'+chain+'hash').val().substr(0, patternLen) <= pattern) {
      // We found a valid hash! (This is the "proof of work")
      if (isChain) {
        // If we're in chain mode, update all subsequent blocks
        updateChain(block, chain);
      }
      else {
        // Otherwise just update this block's visual state
        updateState(block, chain);
      }
      break; // Stop mining once we find a valid hash
    }
  }
  // If we reach maximumNonce without finding a valid hash,
  // the function will just end without updating the state
}
