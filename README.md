# NCU_GPA_Calculator

This is web scraping program for all NCU students to calculate their overall GPA.

## About this project

### Motivation

- Since calculating the GPA by hand is a waste of time and the existing google extension no longer suppoprt the new portal so I decided to build one myself

- It has been tested with my own account and my girlfriend's account it's both correct

### Dependencies

- #### puppeteer-extra & puppeteer-extra-plugin-recaptcha

  puppeteer is a Node.js library that provides a high-level API to control Chrome/Chromium over the DevTools Protocol. Puppeteer-extra is a light-weight wrapper around puppeteer that enables typescript support and lots of cool plugins. puppeteer-extra-plugin-recaptcha is one of the puppeteer plugins that helps solve recaptcha problems.

- #### cheerio

  cheerio is a Node.js library for parsing and manipulating HTML and XML.

## Usage

1. Clone this repository

```shell
git clone https://github.com/kypkk/NCU_GPA_Calculator.git
```

2. cd into the directory and install all the dependencies

```shell
cd NCU_GPA_Calculator
npm i
```

3. Create a new .env file in the directory and put your portal account, portal password and [2captcha](https://2captcha.com/enterpage) api key into it

4. Finally run the index.ts in your shell

```shell
npm start
```
