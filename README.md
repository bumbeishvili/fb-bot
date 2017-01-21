# fb-ritma-messenger-bot
Messenger bot, which answers you with georgian similar rhyme words and also let's you query word db using regex



15 Minute tutorial - https://github.com/jw84/messenger-bot-tutorial


Page Link - https://www.facebook.com/%E1%83%A0%E1%83%98%E1%83%97%E1%83%9B%E1%83%90-369999366702204/

##How is it working

For Regex Search, write him one word,which will be valid regex statement 

`ტესტ`   -  words which consist of `ტესტ`  
`^...$`    -  words, which are three characters length  
`^ა`    - words , which begins with `ა`


To search words with same rhyme, write him word `garitme` and actual word to be rhymed  
`გარითმე ნოსტალგია`   
`გამირითმე მინდორი`  
`gamiritme mandarini`  
`garitme rame`  


## Georgian Description
# გვერდის შესახებ

ჩეთბოტი, რომელიც რითმავს ქართულ სიტყვებს და რეგექსი თუ იცით, უფრო კაი რაღაცებსაც აკეთებს


### როგორ უნდა გავრითმოთ სიტყვა?
უბრალოდ მიწერეთ   
`გამირითმე კაკალი`   

ან უფრო რთული  ვცადოთ   
`გარითმე ჰიდროელექტროსადგური` 

### რეგექსი ვიცი და როგორ გამოვიყენო?
უბრალოდ მიწერეთ ერთი სიტყვა რომელიც ვალიდური რეგექსის ბრძანება იქნება    

---  

**case** : მინდა კრეატიული დომეინი   

`მე$` - სიტყვები რომელიც me-ზე მთავრდება    
`იო$` - სიტყვები რომელიც io-ზე მთავრდება  
`ჯი$` - სიტყვები რომელიც ჯი-ზე მთავრდება   
`მი$` - სიტყვები რომელიც მი-ზე მთავრდება  
`მე$` - სიტყვები რომელიც მე-ზე მთავრდება  
`გა$` - სიტყვები რომელიც გა-ზე მთავრდება  

---

**case** : მინდა კრეატიული მანქანის ნომერი  

`^..ასი..$` - ყველა სიტყვა, რომლებშიც '100' ურევია და წინ და ბოლოს ორი ასო აქვს -`kl100ka`
`^..ოც..$` - ყველა სიტყვა, რომლებშიც 'ოც' ურევია და წინ და ბოლოს ორი ასო აქვს -` il020et`


---

**other**  
`^(.)(.)(.)\2\1$` - 5 ასოიანი პალინდრომები (თავიდან და ბოლოდან ერთნაირად იკითხება)  



