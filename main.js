    const maxWidth = 640;
    const maxHeight = 480;
    const battlefieldLength = 1440;

    class Background
    {
        constructor(image, x)
        {
            this.x = x;
            this.y = 0;
    
            this.image = new Image();
            this.image.src = image;
        }
    
        move(d) {
            this.x += d; 
        }
    }
        
    class Player
    {
        constructor(image, x, y)
        {
            this.x = x;
            this.y = y;
     
            this.image = new Image();
            this.image.src = image;
            this.scale = 1;
            this.speed = 5;
            this.hp = 100;
            this.mp = 100;
            this.paramsUpdate = 0;
            this.direction = true; // направление игрока, вправо - true, влево - false 
            this.isBlocking = false; 
        }
     
        update()
        {
            if(this.hp <= 0) {
                gameOverFlag = true; // завершаем игру при смерти игрока
            }
            if( this.x >= maxWidth-80 )  {
                gameOverFlag = true; // завершаем игру, когда игрок доходит до конца карты
            } 
            // регенерация hp и mp игрока
            this.paramsUpdate++;
            if(this.paramsUpdate == 60) {
                if(this.hp < 100) {
                    this.hp += 2;
                }
                if(this.mp < 100) {
                    this.mp += 5;
                }
                if(this.mp < 0) {
                    this.mp = 0;
                }
                this.paramsUpdate = 0;
            } 
        }
     
        move(d) 
        {    
            this.x += d;
             
            //Если при смещении объект выходит за края холста, то изменения откатываются
            if(this.x < 0)
            {
                this.x = 0;
            }  
    
        }
    }
    
    class Perk 
    {
        constructor(image, key, mc, ru, dmg) {
            this.image = new Image()
            this.image.src = image;
            this.key = key;
            this.manaCost = mc;
            this.reusage = ru;
            this.dmg = dmg;
            this.isUsed = false;
        }
    
        // если перк использован блокируем на время перезарядки
        perkUsed() {
            if(!this.isUsed) {
                this.isUsed = true;
                setTimeout( () => {
                    this.isUsed = false;
                }, this.reusage * 1000);
            }
        }
    }
    
    class Enemy 
    {
        constructor(image, type) {
            this.image = new Image();
            this.image.src = image;
            this.scale = 0.5;
            this.type = type;
            this.isAlive = true;
            this.x = maxWidth - getRandomInt(50);    // случайное начальное положение врага   
            this.y = maxHeight-150; 
            this.attackZone = 75;
            this.direction = false;
            this.isReadyToHit = true; // флаг который отвечает за готовность ударить игрока
    
            // для каждого типа врагов свои параметры 
            switch (type) {
                case 0:
                {
                    this.hp = 15;
                    this.dmg = 2;
                    this.speed = 5;
                    this.attackSpeed = 3;
                    break;
                }
                case 1:
                {
                    this.hp = 30;
                    this.dmg = 5;
                    this.speed = 3;
                    this.attackSpeed = 2;
                    break;
                }
                case 2:
                {
                    this.hp = 60;
                    this.dmg = 10;  
                    this.speed = 2;
                    this.attackSpeed = 1;
                    break;         
                }
            }
        }
    
        // логика действий злых существ
        // передаём игрока чтобы они могли его преследовать
        action(pl) {
            if(pl.x + 75 <= this.x) {
                this.direction = false
                this.x -= this.speed;
            }
            else if (pl.x  > this.x+140) {
                this.direction = true;
                this.x += this.speed;
            }
    
            if(this.isReadyToHit && (pl.x > this.x - this.attackZone)) {
                this.isReadyToHit = false;
                setTimeout(() => {
                    if(!pl.isBlocking) pl.hp -= this.dmg;
                    this.isReadyToHit = true;  // после того как пройдёт анимация удара разрешаем сделать следующий
                }, 3000 / this.attackSpeed)
            }
    
        }
    
        getsDamage(dmg) {
            this.hp -= dmg;
            if(this.hp <= 0) 
            {
                this.isAlive = false;
                score++;
            }
        }
    }
    
    class Projectile 
    {
        constructor(image, speed, x, y, dmg) {
            this.image = new Image();
            this.image.src = image;
            this.scale = 0.15;
            this.speed = speed;
            this.x = x;
            this.y = y;
            this.dmg = dmg;
            this.isAlive = true;
            this.direction = true;
        }
    
        action() {
            this.direction ? this.x += this.speed : this.x -= this.speed;
        }
    }

   //инициализация
    let score = 0;
    let totalTime = 0;
    let frameNum = 0; // текущий фрейм (от 0 до 60), используется при анимации
    let gameOverFlag = false; 
    let pauseFlag = false;
    let updateTimer;
    let enemyGeneratorTimer;
    let gameTimer;
    let player = new Player("assets/elf.png", 1, maxHeight-150);
    let bg = new Background("assets/background.png", 0, 0);
    let enemies = [];  
    let enemyImg = [];
    let perks = [];
    let projectiles = [];
    let taPerk = 0;
    let raPerk = 0;

    window.addEventListener("keydown", function (e) { getKey(e); });
    window.addEventListener("keyup", function (e) { keyUp(e) });
    let canvas = document.getElementById("main-window");
    let context = canvas.getContext("2d"); 
     
    perks[0] = new Perk("assets/shot.png", 49, 0, 0, 15);
    perks[1] = new Perk("assets/block.png", 50, 5, 0, 0);
    perks[2] = new Perk("assets/three_arrows.png", 51, 10, 3, 40);
    perks[3] = new Perk("assets/grad.png", 52, 30, 15, 100);   
    enemyImg[0] = "assets/goblin_attack.png";
    enemyImg[1] = "assets/troll_attack.png";
    enemyImg[2] = "assets/orc_attack.png";
    
    function startGame() {
        updateTimer = setInterval( update, 1000 / 60);                          //запускаем функцию обновления игры 60 раз в секунду
        enemyGeneratorTimer = setInterval(addEnemy, (getRandomInt(3)+3)*1000);  //добавляем врагов
        gameTimer = setInterval( () => {totalTime++}, 1000);                     //запускаем основной таймер
    }
    // Функция обработки нажатия клавиш 
    function getKey(e) {      
        switch(e.keyCode)
        {
            case 37: //идти назад
            {
                player.direction = false;
                if(player.x > 0) {
                    player.move(-player.speed);
                }
                else if(bg.x !== 0) {
                    bg.move(player.speed);
                }
                break;
            }
 
            case 39: //идти вперёд
            {
                player.direction = true;
                if((player.x < maxWidth / 2 ) || (bg.x < (maxWidth - battlefieldLength))) {
                    player.move(player.speed);  
                } 
                else {
                    bg.move(-player.speed);
                }
                break;
            }   
              
            case 49:  // способность 1
            {
                if(true) {
                    perks[0].perkUsed();
                    let pr = new Projectile("assets/projectile.png", 8, player.x, player.y + 60, perks[0].dmg);
                    pr.direction = player.direction;
                    projectiles.push(pr);     // добавляем стрелу в массив стрел
                }
                break;
            }
                
            case 50:  // способность 2
            {
                if(player.mp >= perks[1].manaCost) {
                    perks[1].perkUsed();
                    player.mp -= perks[1].manaCost;  
                    player.isBlocking = true;
                }
                break;    
            }

            case 51:   // способность 3
            {
                if(!perks[2].isUsed && (player.mp >= perks[2].manaCost)) {
                    perks[2].perkUsed();
                    player.mp -= perks[2].manaCost;
                    taPerk = new Projectile("assets/threeArrows.png", 10, player.x, player.y + 50, perks[2].dmg);
                    taPerk.direction = player.direction;
                }
                break;
            }
            case 52:  // способность 4
            {
                if(!perks[3].isUsed && (player.mp >= perks[3].manaCost)) {
                    perks[3].perkUsed();
                    player.mp -= perks[3].manaCost;
                    raPerk = new Projectile("assets/rainArrows.png", 8, player.x + 100, player.y - 200, perks[3].dmg);
                    raPerk.direction = player.direction;
                }
                break;
            }
            case 27: //Esc
            {
                if(!pauseFlag) {
                    pauseGame();
                    pauseFlag = true;
                } else {
                    unpauseGame();
                    pauseFlag = false;
                }
                break;
            }
        }
    }
    
    // Обработчик отжатия клавиши пользователем. Нужен для работы блока(способность 2)
    function keyUp(e) {
        if(e.keyCode === 50) player.isBlocking = false;
    }

    // функция отрисовки объектов на экран
    function render() {
        context.clearRect(0, 0, canvas.width, canvas.height); // очищаем канвас каждый фрейм
        drawBG();
        drawInterface();
        redrawPerks();

        if(player.isBlocking){
            animate(player, 0, 280, 75, 130, player.direction); // анимация блока
        } 
        animate(player, 0, 150, 75, 130, player.direction);     // анимация движения

        enemies.forEach(enemy => {
            if(!enemy.isReadyToHit) {
                animate(enemy, 0, 0, 280, 245, enemy.direction); // анимация удара врага
            }

            // анимации движения врагов
            else {
                if(enemy.direction) {
                    context.drawImage(enemy.image, 0, 0, 280, 245,
                        enemy.x, enemy.y, 280*enemy.scale, 245*enemy.scale);
                }
                else {
                    drawReverse(enemy, 280, 245);
                }
            }
        });
      //  рисуем стрелы
        drawArrayOfObjects(projectiles, 360, 118);
    }

    // Отрисовка фона
    function drawBG(){
        context.drawImage(bg.image, bg.x, bg.y);
    }

    // Рисуем интерфейс пользователя
    function drawInterface () {
        let playerName = document.getElementById("name").value;
        context.font = "32px serif";
        context.fillStyle = "#ff0000";
        context.fillText("HP: " + player.hp, 0, 30);
        context.fillStyle = "#0000ff";
        context.fillText("MP: " + player.mp, 0, 70);
        context.fillStyle = "#ffffff";
        context.fillText("Time: " + Math.floor(totalTime/60) + ":" + totalTime % 60, 0, 110);
        context.fillText("Score: " + score, 0, 150);
        context.fillText("Name: " + playerName, 0, 190);

        for(let i=0; i<4; i++) {
            context.drawImage(perks[i].image, 250+i*50, 10, 50, 50);
            context.fillText(i+1, 275+i*50, 65);
        }  
    }

    // Рисуем способности
    function redrawPerks() {
        perks.forEach(perk => {
            if(perk.isUsed)  // закрашиваем синим способности, которые на перезарядке
            {   
                context.fillStyle = "rgba(0, 0, 255, 0.5)";
                switch(perk.key) 
                {
                    case 49:  
                        context.fillRect(250, 10, 50, 50);       
                        break;              
                    case 50:  
                        context.fillRect(300, 10, 50, 50);
                        break;
                    case 51:   
                        context.fillRect(350, 10, 50, 50);
                        break;
                    case 52:  
                        context.fillRect(400, 10, 50, 50);
                        break;
                }
            }    
        });

        // рисуем три летящие стрелы (способность 3)
        if(taPerk.isAlive) {
            context.drawImage(taPerk.image, 0, 0,
                taPerk.image.width, 
                taPerk.image.height,
                taPerk.x, taPerk.y,
                taPerk.image.width*0.3, taPerk.image.height*0.3);
            taPerk.action();
        }
        // рисуем град стрел (способность 4)
        if(raPerk.isAlive) {
            context.drawImage(raPerk.image, 0, 0,
                raPerk.image.width, 
                raPerk.image.height,
                raPerk.x, raPerk.y,
                raPerk.image.width*0.3, raPerk.image.height*0.3);
            raPerk.y += raPerk.speed;
        }
    }

    // функция отрисовки на канвас массива элементов
    function drawArrayOfObjects(arr, width, height) {
        if(arr) {
            arr.forEach((item) => {
            if(item.direction) {
                    context.drawImage(item.image, 0, 0, width, height,
                                    item.x, item.y, width*item.scale, height*item.scale);
                }
                else {
                    drawReverse(item, width, height);
                }
            });
        }
    }

    //  функция, которая рисует отзеркаленное изображение    
    function drawReverse(obj, width, height) {
        context.save();
        context.translate(width*obj.scale, 0);
        context.scale(-1, 1);
        context.drawImage(  obj.image, 0, 0, width, height, -obj.x, obj.y, width*obj.scale, height*obj.scale );
        context.restore();
    }

     // Обновление игры: проводим рассчёты и вызываем render
    function update()
    {
        frameNum++;       // сохраняем номер текущего фрейма в переменной, нужно для анимации
        if(frameNum>60) {
            frameNum = 0;
        }

        enemies.forEach(enemy => {
            if(enemy.x < 0) enemy.isAlive = false;
            enemy.action(player);  // запускаем действие для каждого врага из массива
        });

        projectiles.forEach(pr => {
            if(pr.x >= maxWidth) pr.isAlive = false;
            pr.action();        // запускаем действие для каждой стрелы из массива
        });
   
        player.update();
        collisionDetection();
        deleteUnexistingElements(enemies);
        deleteUnexistingElements(projectiles);

        render();
        if(gameOverFlag) gameOver();
    }

    // добавление нового врага в массив
    function addEnemy() {
        // количество врагов не должно быть больше 10
        if(enemies.length < 10) {
            let enemyType = getRandomInt(3);
            enemies.push(new Enemy(enemyImg[enemyType], enemyType));
        }
    }
    
    //обнаружение столкновений 
    function collisionDetection() {
        for(let i=0; i < enemies.length; i++) {
            // проверяем столкновение врагов со стрелами
            for(let j=0; j < projectiles.length; j++) {
                if(enemies[i].x <= projectiles[j].x + 54) {
                    enemies[i].getsDamage(projectiles[j].dmg);
                    projectiles[j].isAlive = false;
                }
            }
            // столкновения врагов со способностями
            if(taPerk.x + 50 >= enemies[i].x && taPerk.isAlive) {
                enemies[i].getsDamage(taPerk.dmg);
                taPerk.isAlive = false;
            }

            if(raPerk.x >= enemies[i].x && raPerk.isAlive) {
                enemies[i].getsDamage(raPerk.dmg);
                raPerk.isAlive = false;
            }
        }
    }

    // проверяем элементы массива, если они были уничтожены во время коллизии то удаляем
    function deleteUnexistingElements(arr) {
        arr.forEach((elem, index) => {
            if(!elem.isAlive) {
                arr.splice(index, 1);
            }
        });
    }
    
    //  Поставить игру на паузу 
    function pauseGame() {
        context.fillStyle = "rgba(0, 0, 0, 0.5)";
        context.fillRect(0, 0, maxWidth, maxHeight);
        clearInterval(updateTimer);
        clearInterval(gameTimer);
        clearInterval(enemyGeneratorTimer);
    }

    //  Снять с паузы
    function unpauseGame() {
        updateTimer = setInterval(update, 1000 / 60);
        gameTimer = setInterval(() => {totalTime++}, 1000);
        enemyGeneratorTimer = setInterval(addEnemy, (getRandomInt(3)+3)*1000)
    }

    // Функция завершения игры
    function gameOver() {
        let playerName = document.getElementById("name").value;
        if(player.hp <=0) {
            context.fillStyle = "rgba(255, 0, 0, 0.8)";  // красный экран если убит
        } else {
            context.fillStyle = "rgba(0, 0, 0, 0.3)";    // серый если дошёл до конца
        }
        context.fillRect(0, 0, maxWidth, maxHeight);
        context.fillStyle = "#ffffff";
        context.fillText("GAME OVER", maxWidth / 2 - 100, maxHeight/ 2)

        // останавливаем все таймеры
        clearInterval(updateTimer);
        clearInterval(gameTimer);
        clearInterval(enemyGeneratorTimer);
        
        // Загружаем результаты из localStorage
        let results = [];
        for(let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            let item = localStorage.getItem(key);
            let index = item.indexOf("%");
            let data = {};
            data.name = item.slice(0, index);
            let index2 = item.indexOf("^");
            data.score = parseInt(item.slice(index+1, index2));
            data.time = parseInt(item.slice(index2+1));
            results.push(data);
        }

        // Функция сравнения двух результатов игры, нужна для сортировки массива результатов
        function compare(a, b) {
            if(a.score === b.score) {
                if(a.time === b.time) return 0;
                return a.time > b.time ? 1: -1;
            }
            return a.score < b.score ? 1: -1; 
        }
  
        results.sort(compare);  // сортируем по убыванию

        // добавляем результаты текущего пользователя в массив результатов
        let user = {};
        user.name = playerName;
        user.score = score;
        user.time = totalTime;
        if(results[results.length-1].score > user.score) {
            results.pop();
            results.push(user);
        } else {
            results.push(user);
            results.sort(compare);
            results.pop();
        }

        // добавляем результаты в элемент <table>
        let res = document.getElementById("results");
        let main = document.getElementById("main-window");
        let resultTable = document.getElementById("result-table");

        for(let i = 0; i < results.length; i++) {
            let tr = document.createElement('tr');
            let position = document.createElement('td');
            position.innerText = i+1;
            tr.appendChild(position);
            let name = document.createElement('td');
            name.innerText = results[i].name;
            tr.appendChild(name);
            let score = document.createElement('td');
            score.innerText = results[i].score;
            tr.appendChild(score);
            let time =  document.createElement('td');
            time.innerText = results[i].time;
            tr.appendChild(time);
            resultTable.appendChild(tr);
        }
        
        // сохранеяем результаты в localStorage браузера
        localStorage.clear();
        for(let i = 0; i < 10; i++) {
            localStorage.setItem(+i, results[i].name + "%" + results[i].score + "^" + results[i].time);
        }

        // обнуляем состояние игры для следующего запуска
        gameOverFlag = false;
        pauseFlag = false;
        totalTime = 0;
        score = 0;
        gameTimer = null;
        updateTimer = null;
        enemyGeneratorTimer = null;
        bg.x = 0;
        enemies = [];
        projectiles = [];
        taPerk = 0;
        raPerk = 0;
        frameNum = 0;
        perks.forEach((perk) => { perk.isUsed = false; })
        player = new Player("assets/elf.png", 1, maxHeight-150);

        // три секунды будет показываться экран GameOver, потом выведем таблицу результатов
        setTimeout(() => {
            main.style.display = "none";
            res.style.display = "block";
        }, 3000);
    }

// Функция, рисующая анимацию из спрайтлиста
// Параметры: Объект со свойством image, указывающим на спрайтлист
//            начальные координаты спрайта на изображении
//            ширина и высота одного спрайта
//            направление анимации - true(прямое) или false(обратное)
    function animate(obj, startx, starty, width, height, animDirection) {
        if(animDirection) {
            context.drawImage(
                obj.image, 
                startx + width * ((Math.floor(frameNum/10) % 6)), //Начальное положение по оси X на изображении
                starty, //Начальное положение по оси Y на изображении
                width, //Ширина изображения
                height, //Высота изображения
                obj.x, //Положение по оси X на холсте
                obj.y, //Положение по оси Y на холсте
                width * obj.scale, //Ширина изображения на холсте, умноженная на масштаб
                height * obj.scale //Высота изображения на холсте, умноженная на масштаб
            );
        } else {
            context.save();  // сохраняем контекст
            context.translate(width*obj.scale, 0); // сдвигаем точку начала координат на ширину изображения
            context.scale(-1, 1);  // отражаем избражение зеркально вдоль оси y
            context.drawImage(
                obj.image, 
                startx + width * ((Math.floor(frameNum/10) % 6)), // начальная координата х спрайта меняется каждые 10 кадров
                starty, 
                width, 
                height, 
                -obj.x, 
                obj.y, 
                width * obj.scale,
                height * obj.scale 
            );
            context.restore(); // восстанавливаем контекст
        }
    }

    function getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }