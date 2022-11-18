
<script lang="ts">

import { createCommentVNode, defineComponent, h } from 'vue';
import {ContextMenuEnum} from "@/core/types";

export default defineComponent({
  props: {
    type: {
      type: String,
      default: 'context-menu'
    },
  },
  data() {
    return {
      items: null,
      event: null
    }
  },
  updated() {
    this.setPosition();
  },
  mounted() {
    window.addEventListener('mousedown', this.onMouseDown);
  },
  unmounted() {
    window.removeEventListener('mousedown', this.onMouseDown);
  },
  methods: {
    show(items, event: { clientX: number, clientY: number }) {
      this.items = items;
      this.event = event;
    },
    hide() {
      this.items = null;
      this.event = null;
    },
    onMouseDown(e: MouseEvent) {
      if (!e.target || !this.$el || !this.$el.contains(e.target)) {
        this.hide();
      }
    },
    onContextmenu(e) {
      e.preventDefault();
    },
    setPosition() {
      if (this.event) {
        let { clientX, clientY } = this.event;
        this.$el.style.left = `${clientX}px`;
        this.$el.style.top = `${clientY}px`;
      }
    },
    renderItemList(items) {
      let listItems = items.map(item => {
        let attrs, children;
        switch (typeof item) {
          case 'string':
            if (item === ContextMenuEnum.HorizontalRule) {
              return h('hr');
            } else {
              children = [h('span', item)];
            }
            break;
          case 'object':
            children = [h('span', { innerHTML: item.label })];
            attrs = {
              checked: item.checked || null,
              shortcut: item.shortcut ? item.shortcut.join('+') : null
            };

            if (item.handler) {
              attrs.onClick = (e) => {
                let closed = item.handler(item.value, e);
                if (closed) this.hide();
              }
            }
            if (item.children) {
              children = children.concat(item.children);
            }
            if (item.subItems) {
              attrs.subItems = true;
              children = children.concat(this.renderItemList(item.subItems));
            }
            break;
        }

        return h('li', attrs, children);
      });

      return h('ul', listItems);
    }
  },
  render() {
    let { items } = this;
    if (items) {
      const { onContextmenu } = this;
      const props = {
        class: 'contextmenu',
        type: this.type,
        onContextmenu
      };
      const children = this.renderItemList(items);
      return h('div', props, children);
    } else {
      return createCommentVNode('Context Menu');
    }
  }
});

</script>

<style lang="stylus">

context-menu-padding = 0.4rem;

.contextmenu {
  position: fixed;
  z-index 100;

  ul {
    margin: 0;
    padding: context-menu-padding 0;
    list-style: none;
    background: white;
    border-radius: 2px;
    min-width: 100px;
    box-shadow: 0 0 8px #0003;

    hr {
      margin context-menu-padding 0
      height 1px
      background-color lightgray
      border none
    }

    ul {
      position: absolute;
      top: - context-menu-padding;
      left: 100%;
    }

    li > ul {
      visibility: hidden;
    }

    li:hover > ul,
    li > ul:hover {
      visibility: visible;
    }

    li {
      position: relative;
      padding: 0.2rem 2.2rem 0.2rem 0.8rem;
      font-size: 0.9rem;
      font-family: Helvetica;
      user-select: none;
      color: black;

      &:hover,
      &:focus {
        background-color: #29f;
        color: white;
      }

      &[subitems]:hover::after,
      &[checked]:hover::after {
        background-color: white;
      }

      &[subitems]::after {
        content: '';
        position: absolute;
        margin-top: -6px;
        top: 50%;
        right: 12px;
        width: 12px;
        height: 12px;
        clip-path: path('M2 2 L8 6 L2 10 Z');
        background-color: black;
      }

      &[checked]::after {
        content: '';
        position: absolute;
        margin-top: -6px;
        top: 50%;
        right: 12px;
        width: 12px;
        height: 12px;
        clip-path: path('M 10.1425,1.75 4.5,7.5335002 1.857,5.0280002 0,6.8860002 4.5,11.25 12,3.6075 Z');
        background-color: black;
      }
    }
  }
  &[type="panel"] {
    ul {
      border-radius: 0;
      border: 1px solid lightgray;
      box-shadow none
      min-width: 150px;
      li {
        padding: 0.4rem 2.2rem 0.4rem 0.8rem;

        &[shortcut] {
          padding-right 0.8rem
        }
        &[shortcut]::after {
          float right
          content attr(shortcut)
          color gray
        }

        &[shortcut]:hover::after {
          color white
        }
      }
    }
  }
}
</style>