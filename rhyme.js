


function rhymeRegex(string) {
    var rhymeLevel1Regex = '$';
    var rhymeLevel2Regex = '$';
    var rhymeLevel3Regex = '$';
    var rhymeLevel4Regex = '$';
    var rhymeLevel5Regex = '$';
    var rhymeLevel6Regex = '$';

    var splitedArray = splitBackPartByVowel(string);

    var ConsonantReplacer1 = "";
    var ConsonantReplacer2 = "";
    var ConsonantReplacer3 = "";
    var ConsonantReplacer4 = "";
    var ConsonantReplacer5 = "";
    var ConsonantReplacer6 = "[^aeiou]*";

    if (splitedArray[5] != '') {
        rhymeLevel1Regex = splitedArray[5] + rhymeLevel1Regex;
        rhymeLevel2Regex = generateConsonantRegex(splitedArray[5], '{1}') + rhymeLevel2Regex;
        rhymeLevel3Regex = generateConsonantRegex(splitedArray[5], '{1,}') + rhymeLevel3Regex;
    }
    if (splitedArray[4] != '') {
        rhymeLevel1Regex = splitedArray[4] + rhymeLevel1Regex;
        rhymeLevel2Regex = splitedArray[4] + rhymeLevel2Regex;
        rhymeLevel3Regex = splitedArray[4] + rhymeLevel3Regex;
    }
    if (splitedArray[3] != '') {
        rhymeLevel1Regex = splitedArray[3] + rhymeLevel1Regex;
        rhymeLevel2Regex = generateConsonantRegex(splitedArray[3], '{1}') + rhymeLevel2Regex;
        rhymeLevel3Regex = generateConsonantRegex(splitedArray[3], '{1,}') + rhymeLevel3Regex;
    }
    if (splitedArray[2] != '') {
        rhymeLevel1Regex = splitedArray[2] + rhymeLevel1Regex;
        rhymeLevel2Regex = splitedArray[2] + rhymeLevel2Regex;
        rhymeLevel3Regex = splitedArray[2] + rhymeLevel3Regex;
    }
    if (splitedArray[1] != '') {
        rhymeLevel1Regex = splitedArray[1] + rhymeLevel1Regex;
        rhymeLevel2Regex = generateConsonantRegex(splitedArray[1], '{1,}') + rhymeLevel2Regex;
    }
    if (splitedArray[0] != '') {
        rhymeLevel1Regex = splitedArray[0] + rhymeLevel1Regex;
        rhymeLevel2Regex = splitedArray[0] + rhymeLevel2Regex;
    }
    return {
        level1: rhymeLevel1Regex,
        level2: rhymeLevel2Regex,
        level3: rhymeLevel3Regex
    }
}

// "satesto"    returns 'a','t','e','st','o,''                            
// "vefxvisebr" returns 'e','fxv','i','s','e ','br'                            
function splitBackPartByVowel(string) {
    var array = ['', '', '', '', '', ''];
    var counter = 5;

    for (var i = string.length - 1; i >= 0; i--) {
        if (counter < 0)
            break;
        //contains vowel                            
        if ('aeiou'.indexOf(string[i]) != -1) {
            if (counter % 2 == 1) {
                counter--;
            }
            array[counter--] = string[i];
        } else {
            //contains consonant                            
            var subStrLength = 0;
            while (i >= 0) {
                if ('aeiou'.indexOf(string[i]) != -1) {
                    break;
                }
                subStrLength++;
                i--;
            }
            array[counter--] = string.substring(i + 1, subStrLength + i + 1);
            if (i >= 0) {
                array[counter--] = string[i];
            }
        }
    }
    return array;
}

function getRelatedConsonants(char) {
    var allRelatedConsonats = [
        'bfpm',
        'dTt',
        'v',
        'Zcwzs',
        'jCWJS',
        'gqkRx',
        'y',
        'h',
        'nrl'
    ];
    for (i = 0; i < allRelatedConsonats.length; i++) {
        var relatedConsonants = allRelatedConsonats[i];
        if (relatedConsonants.indexOf(char) != -1) {
            return relatedConsonants;
        }
    }
}


function generateConsonantRegex(consonants, appendRegex) {
    var result = '';
    for (var i = 0; i < consonants.length; i++) {
        result = result + '[' + getRelatedConsonants(consonants[i]) + ']' + appendRegex;
    }
    return result;
}



function vowelsCount(string) {
    var count = 0;
    var vowels = ['a', 'e', 'i', 'o', 'u'];
    for (var i = 0; i < string.length; i++) {
        if (vowels.indexOf(string[i]) !== -1) {
            count++;
        }
    }
    return count;
}

module.exports.rhymeRegex = rhymeRegex;
