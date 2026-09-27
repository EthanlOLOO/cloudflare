from cloakbrowser import launch

browser = launch()
page = browser.new_page()
page.goto("https://item.gmarket.co.kr/Item?spm=gmktpc.besthome.bestitem.ditem0.6e784fc7xT6zYE&goodscode=4212212035")
browser.close()