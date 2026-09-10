///|
test "add and Chinese JSON bridge" {
  inspect(add(2.0, 3.0), content="5")
  inspect(echo_json("{\"label\":\"简投学堂\"}"), content="{\"label\":\"简投学堂\"}")
  inspect(echo_json("{"), content="{\"ok\":false,\"error\":\"invalid JSON\"}")
}
