

        ____                ____
       / __ \____ _      __/ __ )____  ___
      / /_/ / __ \ | /| / / __  / __ \/ _ \
     / _, _/ /_/ / |/ |/ / /_/ / /_/ /  __/
    /_/ |_|\____/|__/|__/_____/\____/\___/

An irc bot based on Node.js
## Features
* Powerful **alias system** to create custom commands
* Ability to `!mute` and `!unmute` RowBoe
* Both a generic **link preview** and custom ones for sites like reddit, tumblr and YouTube
* Links get saved and are searchable on a per-channel basis using `!links`
* Access to online **searches** of `!google`, `!reddit` and `!youtube`
* Access to online **dictionaries** via `!urbandict`, `!define`, `!etymology` and `!thesaurus` as well as Google `!translate` and `!wikipedia`
* **Pass on messages** to people who are currently offline via `!tell`
* Check when a person was **last `!seen`**
* Find out the **`!time` and `!weather`** in places around the world (or let RowBoe know your location via `!setlocation`)
* Much more, notably: `!currency`, `!coinflip`/`!choose`, `!lastfm`, `!imdb`, `!wolfram`, ...


## How to install 
1\. Clone git repository
```
git clone https://github.com/ithil/rowboe.git
```
2\. `cd` into repository
```
cd rowboe
```
3\. Install dependencies
```
npm install
```
4\. Run configuration setup
```
node ./setup.js
````
5\. Launch RowBoe
```
npm start
```
