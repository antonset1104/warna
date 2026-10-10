"""Check generated pages, metadata, links and accessible tool scaffolding."""
from __future__ import annotations
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent / 'dist'
SITE = 'https://warna.vijeron.com'

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]; self.meta={}; self.alternates={}; self.schemas=[]; self.in_schema=False; self.schema_text=''; self.lang=''; self.h1=0; self.main=0
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='html': self.lang=a.get('lang','')
        if tag=='h1': self.h1+=1
        if tag=='main': self.main+=1
        if tag=='a' and 'href' in a: self.links.append(a['href'])
        if tag=='link':
            if a.get('rel')=='canonical': self.meta['canonical']=a.get('href')
            if a.get('rel')=='alternate': self.alternates[a.get('hreflang')]=a.get('href')
        if tag=='meta' and a.get('name')=='description': self.meta['description']=a.get('content')
        if tag=='script' and a.get('type')=='application/ld+json': self.in_schema=True; self.schema_text=''
    def handle_data(self,data):
        if self.in_schema: self.schema_text+=data
    def handle_endtag(self,tag):
        if tag=='script' and self.in_schema:
            self.schemas.append(json.loads(self.schema_text)); self.in_schema=False

def main():
    sitemap=ET.parse(ROOT/'sitemap.xml')
    urls=[node.text for node in sitemap.findall('.//{*}loc')]
    assert len(urls)==len(set(urls))==28
    for url in urls:
        assert url.startswith(SITE+'/')
        path=unquote(urlparse(url).path)
        file=ROOT/path.lstrip('/')/'index.html'
        assert file.is_file(),url
        source=file.read_text(encoding='utf-8')
        page=Page(); page.feed(source)
        assert page.lang in ('id','en') and page.h1==page.main==1,url
        assert page.meta['canonical']==url and len(page.meta['description'])>50,url
        assert page.alternates=={'id':SITE+'/'+path.removeprefix('/en/') if page.lang=='en' else url,
                                 'en':SITE+('/en/'+path.lstrip('/') if page.lang=='id' else path),
                                 'x-default':SITE+'/'+path.removeprefix('/en/') if page.lang=='en' else url},url
        assert len(page.schemas)==1 and page.schemas[0]['url']==url,url
        if '/panduan/' in path: assert page.schemas[0]['@type']=='Article'
        if '/alat/' in path:
            assert page.schemas[0]['@type']=='WebApplication'
            assert "id='calculator'" in source and "aria-live='polite'" in source
        assert 'Product' not in source
        if '/privasi/' in path: assert 'adsbygoogle.js' not in source
        else:
            assert source.index("gtag('consent','default'") < source.index('gtag/js?id=')
            assert 'ca-pub-6180580801533680' in source
        for href in page.links:
            if href.startswith('/'):
                target=href.split('#',1)[0].split('?',1)[0]
                if not target: continue
                assert (ROOT/target.lstrip('/')/'index.html').exists() or (ROOT/target.lstrip('/')).exists(),(url,href)
    assert (ROOT/'robots.txt').read_text().count(SITE+'/sitemap.xml')==1
    assert 'pub-6180580801533680' in (ROOT/'ads.txt').read_text()
    assert (ROOT/'404.html').exists()
    print(f'Checked {len(urls)} public pages, locale links, schemas, ads, consent and local links')

if __name__=='__main__': main()
