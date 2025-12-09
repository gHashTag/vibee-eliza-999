// VIBEE Lustre UI Application
// Universal Application with WebSocket sync

import gleam/dynamic
import gleam/int
import gleam/json
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string
import lustre
import lustre/attribute.{class, id}
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

// ============================================================================
// MODEL
// ============================================================================

pub type Model {
  Model(
    dialogs: List(Dialog),
    messages: List(Message),
    selected_dialog: Option(Int),
    input_text: String,
    is_connected: Bool,
    is_loading: Bool,
    error: Option(String),
  )
}

pub type Dialog {
  Dialog(
    id: Int,
    title: String,
    dialog_type: String,
    unread_count: Int,
  )
}

pub type Message {
  Message(
    id: Int,
    text: String,
    from_id: Int,
    from_name: String,
    group_name: String,
    date: String,
    is_editing: Bool,
  )
}

pub fn init(_flags: Nil) -> #(Model, Effect(Msg)) {
  let model = Model(
    dialogs: [],
    messages: [],
    selected_dialog: None,
    input_text: "",
    is_connected: False,
    is_loading: True,
    error: None,
  )

  // Start by fetching dialogs
  #(model, fetch_dialogs())
}

// ============================================================================
// MESSAGES
// ============================================================================

pub type Msg {
  // Data fetching
  FetchDialogs
  GotDialogs(Result(List(Dialog), String))
  FetchMessages(Int)
  FetchAllMessages
  GotMessages(Result(List(Message), String))

  // User interactions
  SelectDialog(Int)
  UpdateInput(String)
  SendMessage
  EditMessage(Int)
  SaveEdit(Int, String)
  CancelEdit(Int)

  // WebSocket
  WsConnected
  WsDisconnected
  WsMessage(String)

  // Refresh
  Refresh
}

// ============================================================================
// UPDATE
// ============================================================================

pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    FetchDialogs -> {
      #(Model(..model, is_loading: True), fetch_dialogs())
    }

    GotDialogs(Ok(dialogs)) -> {
      #(
        Model(..model, dialogs: dialogs, is_loading: False, is_connected: True),
        fetch_all_messages(),
      )
    }

    GotDialogs(Error(err)) -> {
      #(Model(..model, error: Some(err), is_loading: False), effect.none())
    }

    FetchMessages(dialog_id) -> {
      #(Model(..model, is_loading: True, selected_dialog: Some(dialog_id)),
        fetch_messages(dialog_id))
    }

    FetchAllMessages -> {
      #(Model(..model, is_loading: True), fetch_all_messages())
    }

    GotMessages(Ok(messages)) -> {
      #(Model(..model, messages: messages, is_loading: False), effect.none())
    }

    GotMessages(Error(err)) -> {
      #(Model(..model, error: Some(err), is_loading: False), effect.none())
    }

    SelectDialog(id) -> {
      #(Model(..model, selected_dialog: Some(id)), fetch_messages(id))
    }

    UpdateInput(text) -> {
      #(Model(..model, input_text: text), effect.none())
    }

    SendMessage -> {
      // TODO: Implement send via WebSocket
      #(Model(..model, input_text: ""), effect.none())
    }

    EditMessage(id) -> {
      let messages = list.map(model.messages, fn(m) {
        case m.id == id {
          True -> Message(..m, is_editing: True)
          False -> m
        }
      })
      #(Model(..model, messages: messages), effect.none())
    }

    SaveEdit(id, new_text) -> {
      let messages = list.map(model.messages, fn(m) {
        case m.id == id {
          True -> Message(..m, text: new_text, is_editing: False)
          False -> m
        }
      })
      #(Model(..model, messages: messages), effect.none())
    }

    CancelEdit(id) -> {
      let messages = list.map(model.messages, fn(m) {
        case m.id == id {
          True -> Message(..m, is_editing: False)
          False -> m
        }
      })
      #(Model(..model, messages: messages), effect.none())
    }

    WsConnected -> {
      #(Model(..model, is_connected: True), effect.none())
    }

    WsDisconnected -> {
      #(Model(..model, is_connected: False), effect.none())
    }

    WsMessage(_data) -> {
      // TODO: Parse incoming WebSocket message
      #(model, effect.none())
    }

    Refresh -> {
      #(model, fetch_all_messages())
    }
  }
}

// ============================================================================
// EFFECTS
// ============================================================================

fn fetch_dialogs() -> Effect(Msg) {
  // This would be replaced with actual HTTP fetch
  // For now, return mock data effect
  effect.from(fn(dispatch) {
    // Simulating API call - in real app use gleam_fetch
    let dialogs = [
      Dialog(id: -1_002_737_186_844, title: "Agent Vibe", dialog_type: "supergroup", unread_count: 0),
      Dialog(id: -1_002_643_951_085, title: "AiStars ОФИС", dialog_type: "supergroup", unread_count: 2),
      Dialog(id: -1_001_978_334_539, title: "НейроКодер - Вайб-кодинг", dialog_type: "supergroup", unread_count: 0),
      Dialog(id: -1_001_165_767_969, title: "Биржа IT I Удаленка/Офис", dialog_type: "supergroup", unread_count: 2478),
      Dialog(id: -1_001_728_766_323, title: "Паттайя - Объявления", dialog_type: "supergroup", unread_count: 854),
    ]
    dispatch(GotDialogs(Ok(dialogs)))
  })
}

fn fetch_messages(_dialog_id: Int) -> Effect(Msg) {
  effect.from(fn(dispatch) {
    let messages = [
      Message(id: 138, text: "не тестил", from_id: 144022504, from_name: "Dmitrii NeuroСoder", group_name: "Agent Vibe", date: "2025-11-13T15:29:59", is_editing: False),
      Message(id: 137, text: "крутая задумка - на самом деле", from_id: 484954118, from_name: "Dmitriy Pavlovich", group_name: "Agent Vibe", date: "2025-11-13T15:29:59", is_editing: False),
    ]
    dispatch(GotMessages(Ok(messages)))
  })
}

fn fetch_all_messages() -> Effect(Msg) {
  effect.from(fn(dispatch) {
    let messages = [
      Message(id: 138, text: "не тестил", from_id: 144022504, from_name: "Dmitrii NeuroСoder", group_name: "Agent Vibe", date: "2025-11-13 15:29", is_editing: False),
      Message(id: 137, text: "крутая задумка - на самом деле", from_id: 484954118, from_name: "Dmitriy Pavlovich", group_name: "Agent Vibe", date: "2025-11-13 15:29", is_editing: False),
      Message(id: 136, text: "а мы тестили?", from_id: 484954118, from_name: "Dmitriy Pavlovich", group_name: "Agent Vibe", date: "2025-11-13 15:29", is_editing: False),
      Message(id: 5583, text: "ElevenLabs API временно недоступен (Cloudflare защита)", from_id: 7655182164, from_name: "NeuroBlogger", group_name: "НейроКодер - Вайб-кодинг", date: "2025-09-18 21:23", is_editing: False),
      Message(id: 5579, text: "🎨 НОВАЯ ГЕНЕРАЦИЯ - @keity8 сгенерировал изображение", from_id: 7655182164, from_name: "NeuroBlogger", group_name: "НейроКодер - Вайб-кодинг", date: "2025-09-02 15:12", is_editing: False),
      Message(id: 134, text: "Название 'Vibee' для мобильного приложения звучит актуально и привлекательно", from_id: 144022504, from_name: "Dmitrii NeuroСoder", group_name: "Agent Vibe", date: "2025-11-09 14:07", is_editing: False),
    ]
    dispatch(GotMessages(Ok(messages)))
  })
}

// ============================================================================
// VIEW
// ============================================================================

pub fn view(model: Model) -> Element(Msg) {
  html.div([class("app-container")], [
    view_header(model),
    html.div([class("app-content")], [
      view_sidebar(model),
      view_main(model),
    ]),
  ])
}

fn view_header(model: Model) -> Element(Msg) {
  let status_class = case model.is_connected {
    True -> "status-connected"
    False -> "status-disconnected"
  }
  let status_text = case model.is_connected {
    True -> "Connected to Telegram"
    False -> "Disconnected"
  }

  html.header([class("app-header")], [
    html.div([class("header-left")], [
      html.h1([class("app-title")], [element.text("VIBEE Messages")]),
      html.span([class("subtitle")], [element.text("All Telegram groups in one place")]),
    ]),
    html.div([class("header-right")], [
      html.button([class("btn-refresh"), event.on_click(Refresh)], [
        element.text("↻ Refresh"),
      ]),
      html.span([class("connection-status " <> status_class)], [
        html.span([class("status-dot")], []),
        element.text(status_text),
      ]),
    ]),
  ])
}

fn view_sidebar(model: Model) -> Element(Msg) {
  html.nav([class("sidebar")], [
    html.h2([class("sidebar-title")], [element.text("Groups")]),
    html.button([class("btn-all"), event.on_click(FetchAllMessages)], [
      element.text("📋 All Messages"),
    ]),
    html.ul([class("dialog-list")],
      list.map(model.dialogs, view_dialog_item(_, model.selected_dialog))
    ),
  ])
}

fn view_dialog_item(dialog: Dialog, selected: Option(Int)) -> Element(Msg) {
  let is_active = case selected {
    Some(id) -> id == dialog.id
    None -> False
  }
  let class_name = case is_active {
    True -> "dialog-item active"
    False -> "dialog-item"
  }

  html.li([class(class_name), event.on_click(SelectDialog(dialog.id))], [
    html.div([class("dialog-info")], [
      html.span([class("dialog-title")], [element.text(dialog.title)]),
      case dialog.unread_count > 0 {
        True -> html.span([class("unread-badge")], [
          element.text(int.to_string(dialog.unread_count)),
        ])
        False -> element.none()
      },
    ]),
    html.span([class("dialog-type")], [element.text(dialog.dialog_type)]),
  ])
}

fn view_main(model: Model) -> Element(Msg) {
  html.main([class("main-content")], [
    view_message_header(model),
    case model.is_loading {
      True -> html.div([class("loading")], [element.text("Loading messages...")])
      False -> view_message_list(model)
    },
    case model.error {
      Some(err) -> html.div([class("error")], [element.text("Error: " <> err)])
      None -> element.none()
    },
    view_input_area(model),
  ])
}

fn view_message_header(model: Model) -> Element(Msg) {
  let title = case model.selected_dialog {
    Some(id) -> {
      let found = list.find(model.dialogs, fn(d) { d.id == id })
      case found {
        Ok(dialog) -> dialog.title
        Error(_) -> "All Messages"
      }
    }
    None -> "All Messages"
  }

  html.div([class("message-header")], [
    html.h2([class("section-title")], [element.text(title)]),
    html.span([class("message-count")], [
      element.text(int.to_string(list.length(model.messages)) <> " messages"),
    ]),
  ])
}

fn view_message_list(model: Model) -> Element(Msg) {
  html.ul([class("message-list")],
    list.map(model.messages, view_message_item)
  )
}

fn view_message_item(msg: Message) -> Element(Msg) {
  html.li([class("message-item"), id("msg-" <> int.to_string(msg.id))], [
    html.div([class("message-meta")], [
      html.span([class("group-badge")], [element.text(msg.group_name)]),
      html.span([class("sender")], [element.text(msg.from_name)]),
      html.span([class("timestamp")], [element.text(msg.date)]),
    ]),
    case msg.is_editing {
      True -> html.div([class("message-edit")], [
        html.textarea([class("edit-input")], msg.text),
        html.div([class("edit-actions")], [
          html.button([class("btn-save"), event.on_click(SaveEdit(msg.id, msg.text))], [
            element.text("Save"),
          ]),
          html.button([class("btn-cancel"), event.on_click(CancelEdit(msg.id))], [
            element.text("Cancel"),
          ]),
        ]),
      ])
      False -> html.div([class("message-body")], [
        html.p([class("message-text")], [element.text(msg.text)]),
        html.button([class("btn-edit"), event.on_click(EditMessage(msg.id))], [
          element.text("Edit"),
        ]),
      ])
    },
  ])
}

fn view_input_area(model: Model) -> Element(Msg) {
  html.div([class("input-area")], [
    html.textarea([
      class("message-input"),
      attribute.placeholder("Type a message..."),
      event.on_input(UpdateInput),
    ], model.input_text),
    html.button([class("btn-send"), event.on_click(SendMessage)], [
      element.text("Send"),
    ]),
  ])
}

// ============================================================================
// MAIN
// ============================================================================

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}
