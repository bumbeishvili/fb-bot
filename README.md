# fb personal bot
Messenger bot, which answers you with georgian similar rhyme words and also let's you query word db using regex



15 Minute tutorial - https://github.com/jw84/messenger-bot-tutorial


Page Link - https://www.facebook.com/geo.lang.bot/



**New Ideas**  
1. [weather](ideas/weather.md)    


urls:  
`/admin` - configurations for bot  
`/conversations` - conversations history  

## How is it working

For Regex Search, write him one word,which will be valid regex statement and prepent word `regex` 

`regex ტესტ`   -  words which consist of `ტესტ`  
`regex ^...$`    -  words, which are three characters length  
`regex ^ა`    - words , which begins with `ა`


To search words with same rhyme, write him word `garitme` and actual word to be rhymed  
`გარითმე ნოსტალგია`   
`გამირითმე მინდორი`  
`gamiritme mandarini`  
`garitme rame`  





