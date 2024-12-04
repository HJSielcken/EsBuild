module.exports = {
  harmen: {
    universal: {
      serverWrapper: '/wrappers/Server',
      clientWrapper: '/wrappers/Client',
    },
    compileForServer: [
      /@kaliber\/routing/,
      /@kaliber\/safe-json-stringify/,
      /@kaliber\/use-is-mounted-ref/

    ]
  }
}
