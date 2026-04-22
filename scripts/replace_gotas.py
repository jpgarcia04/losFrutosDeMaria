import os
import re

gotas_data = {
    "chicas": [
        {"name": "Liverpool", "url": "https://www.liverpool.com.mx/tienda/pdp/aceite-cbd-los-frutos-de-mar%C3%ADa/1177632577?skuid=1177632577"},
        {"name": "Suburbia", "url": "https://www.suburbia.com.mx/tienda/pdp/aceite-cbd-los-frutos-de-mar%C3%ADa/1177632577?skuid=1177632577"}
    ],
    "grandes": [
        {"name": "Liverpool", "url": "https://www.liverpool.com.mx/tienda/pdp/aceite-cbd-los-frutos-de-mar%C3%ADa/1177635835?skuid=1177635835"},
        {"name": "Suburbia", "url": "https://www.suburbia.com.mx/tienda/pdp/aceite-cbd-los-frutos-de-mar%C3%ADa/1177635835?skuid=1177635835"}
    ],
    "fuertes": [
        {"name": "Liverpool", "url": "https://www.liverpool.com.mx/tienda/pdp/gotas-los-frutos-de-mar%C3%ADa/1179063847?skuid=1179063847"}
    ]
}

def generate_buttons_html(links):
    html = ""
    for link in links:
        if link["name"] == "Amazon":
            icon = """<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M10.813 11.968c.157.083.36.074.5-.05l.005.005a90 90 0 0 1 1.623-1.405c.173-.143.143-.372.006-.563l-.125-.17c-.345-.465-.673-.906-.673-1.791v-3.3l.001-.335c.008-1.265.014-2.421-.933-3.305C10.404.274 9.06 0 8.03 0 6.017 0 3.77.75 3.296 3.24c-.047.264.143.404.316.443l2.054.22c.19-.009.33-.196.366-.387.176-.857.896-1.271 1.703-1.271.435 0 .929.16 1.188.55.264.39.26.91.257 1.376v.432q-.3.033-.621.065c-1.113.114-2.397.246-3.36.67C3.873 5.91 2.94 7.08 2.94 8.798c0 2.2 1.387 3.298 3.168 3.298 1.506 0 2.328-.354 3.489-1.54l.167.246c.274.405.456.675 1.047 1.166ZM6.03 8.431C6.03 6.627 7.647 6.3 9.177 6.3v.57c.001.776.002 1.434-.396 2.133-.336.595-.87.961-1.465.961-.812 0-1.286-.619-1.286-1.533M.435 12.174c2.629 1.603 6.698 4.084 13.183.997.28-.116.475.078.199.431C13.538 13.96 11.312 16 7.57 16 3.832 16 .968 13.446.094 12.386c-.24-.275.036-.4.199-.299z"/><path d="M13.828 11.943c.567-.07 1.468-.027 1.645.204.135.176-.004.966-.233 1.533-.23.563-.572.961-.762 1.115s-.333.094-.23-.137c.105-.23.684-1.663.455-1.963-.213-.278-1.177-.177-1.625-.13l-.09.009q-.142.013-.233.024c-.193.021-.245.027-.274-.032-.074-.209.779-.556 1.347-.623"/></svg>"""
        elif link["name"] == "Liverpool":
            icon = """<img src="../images/liverpool.webp" alt="Logo de Liverpool" style="height: 32px; width: auto; object-fit: contain;" />"""
        else:
            icon = """<img src="../images/suburbia.webp" alt="Logo de Suburbia" style="height: 32px; width: auto; object-fit: contain;" />"""

        html += f"""          <a href="{link["url"]}" target="_blank" rel="noopener" class="store-card" style="background: var(--card-bg); padding: 10px 16px; justify-content: center; flex: 1; min-width: 140px; box-shadow: none;">
            <span class="store-name" style="display: flex; align-items: center; gap: 12px;">
              {icon}
              {link["name"]}
            </span>
          </a>\n"""
    return html

with open("productos/gotas.html", "r", encoding="utf-8") as f:
    content = f.read()

# Generate the blocks
block_300 = ""
for size in ["chicas", "grandes"]:
    title = f"Gotas {size.capitalize()}"
    b_html = generate_buttons_html(gotas_data[size])
    block_300 += f"""          <p style="font-weight: 600; margin-bottom: 12px; margin-top: 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted);">{title}:</p>
          <div class="store-links" style="display: flex; flex-direction: row; flex-wrap: wrap; gap: 12px; justify-content: center; width: 100%; max-width: 500px; margin: 0 auto;">
{b_html}          </div>\n"""

block_1000 = ""
title = "Gotas Fuertes"
b_html = generate_buttons_html(gotas_data["fuertes"])
block_1000 += f"""          <p style="font-weight: 600; margin-bottom: 12px; margin-top: 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted);">{title}:</p>
          <div class="store-links" style="display: flex; flex-direction: row; flex-wrap: wrap; gap: 12px; justify-content: center; width: 100%; max-width: 500px; margin: 0 auto;">
{b_html}          </div>\n"""

tabs_html = """        <div class="variant-tabs" style="margin-top: 24px; margin-bottom: 0px;">
          <button class="variant-tab is-active" data-variant="variant-300">300 mg / 30 ml (Suaves)</button>
          <button class="variant-tab" data-variant="variant-1000">1,000 mg / 30 ml (Fuertes)</button>
        </div>"""

new_hero_options = f"""        <div class="product-buy-options" style="margin-top: 16px; display: flex; flex-direction: column; align-items: center; width: 100%;">
{tabs_html}
          <div class="variant-panel link-variant-300 is-active" style="width: 100%;">
{block_300}          </div>
          <div class="variant-panel link-variant-1000" style="width: 100%;">
{block_1000}          </div>
        </div>"""

new_cta_options = f"""      <div class="product-buy-options" style="margin-top: 24px; margin-inline: auto; max-width: 500px; display: flex; flex-direction: column; align-items: center;">
{tabs_html}
          <div class="variant-panel link-variant-300 is-active" style="width: 100%;">
{block_300}          </div>
          <div class="variant-panel link-variant-1000" style="width: 100%;">
{block_1000}          </div>
      </div>"""

# Remove old tabs from section (only the first occurrence to avoid removing bottom if identical)
old_tabs_section = """        <div class="variant-tabs">
          <button class="variant-tab is-active" data-variant="variant-300">300 mg / 30 ml</button>
          <button class="variant-tab" data-variant="variant-1000">1,000 mg / 30 ml</button>
        </div>"""
content = content.replace(old_tabs_section, "")

content = re.sub(r'<div class="product-buy-options" style="margin-top: 16px;">.*?(?=</div>\s*</div>\s*</div>\s*</section>)', new_hero_options + "\n        ", content, flags=re.DOTALL)

content = re.sub(r'<div class="product-buy-options" style="margin-top: 24px; margin-inline: auto; max-width: 300px;">.*?(?=\s*</div>\s*</section>)', new_cta_options + "\n", content, flags=re.DOTALL)

with open("productos/gotas.html", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
